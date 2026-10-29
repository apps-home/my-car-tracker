# My Car Tracker API — Documentação de Conceito

## 1. Visão Geral

API do **My Car Tracker**: centraliza as informações do automóvel do usuário (abastecimentos, despesas, manutenções e planos preventivos por tempo e quilometragem). O conceito completo, com o schema e as regras de negócio, está em `docs/CONCEPT.md`.

Hoje a API tem só a fundação: autenticação, módulo `user` (consulta e avatar) e a infraestrutura (Prisma, filas, cron, eventos, R2, n8n e Novu). Os módulos do domínio entram pelo roteiro da seção 8 do conceito.

---

## 2. Pilares Tecnológicos

| Camada | Tecnologia |
|---|---|
| **Backend** | NestJS 12 com arquitetura modular e workers |
| **Banco de Dados** | PostgreSQL (`my_car_tracker_db`) via Prisma 7, no submódulo `@lib/my-car-tracker-db` |
| **Processamento Assíncrono** | Redis + BullMQ (filas e cron jobs) |
| **Autenticação** | Better Auth via submódulo `@lib/auth` (sessões, OAuth, tokens) |
| **Armazenamento de Arquivos** | Cloudflare R2 (S3-compatible), bucket `my-car-tracker` |
| **Notificações** | Novu (Inbox In-App) e n8n (webhooks de e-mail) |
| **Qualidade** | Biome (linting/formatação), Vitest e `scripts/check-version.mjs` |

---

## 3. Arquitetura de Módulos (`src/modules`)

```
modules/
└── user/   # Usuário do Better Auth (consulta e avatar)
```

Previstos no conceito: `vehicles`, `fuel-logs`, `expenses`, `maintenances`, `schedules` e `analytics`.

Cada módulo segue a arquitetura em camadas (DDD / Clean Architecture):

```
<modulo>/
├── <nome>.module.ts
├── domain/
│   ├── <nome>.entity.ts        # Entidade (regras de negócio e validações)
│   ├── <nome>.mapper.ts        # Mapper de domínio (payload -> entidade, entidade -> resposta HTTP)
│   ├── <nome>.repository.ts    # Contrato abstrato do repositório (token de DI)
│   └── dto/                    # Payloads e parâmetros de busca do domínio
├── application/
│   ├── use-cases/              # Casos de uso (um arquivo por caso de uso, specs ao lado)
│   └── errors/                 # Erros do módulo (<nome>-not-found.error.ts)
├── infra/
│   ├── <nome>.controller.ts    # Controller HTTP
│   ├── <nome>.dto.ts           # DTOs de entrada (class-validator)
│   └── repositories/           # prisma.<nome>.repository.ts e prisma.<nome>.mapper.ts
└── adapters/                   # Opcional: listeners, consumers BullMQ e crons
```

### Autenticação e Escopo por Usuário

**Todas as rotas exigem sessão.** O `SessionAuthGuard` vem do `@lib/auth/nest`: `InfraModule` importa `AuthModule.forRoot({ sessionStore: PrismaSessionStore })`, que o registra como `APP_GUARD`, então a proteção é o padrão e não depende de cada controller:

- O cliente envia `Authorization: Bearer <session.token>` (token da sessão do Better Auth, que o web obtém com `authClient.getSession()`).
- O guard busca o token pelo `PrismaSessionStore` (`src/infra/auth/prisma-session-store.ts`, tabela `session` via `prismaAuth`). Token ausente, inexistente ou expirado responde **401**.
- O `@nestjs/*` precisa ficar no `publicHoistPattern` do `pnpm-workspace.yaml`: é por ele que o lib encontra o `@nestjs/common` do service na imagem de produção (ver `packages/lib-auth/AGENTS.md`).
- O `userId` vem **somente** da sessão. Nos controllers, use o decorator `@CurrentUserId()` de `@lib/auth/nest`. Nenhum controller deve ler `request.headers`.

**Cada usuário só enxerga e altera o que é dele.** Isso vale por padrão, sem métodos "ByUser" paralelos:

- Métodos de repositório que lêem dado do usuário recebem `userId` obrigatório: `findById(id, userId)`, `list({ userId, ... })`. Esquecer o `userId` é erro de compilação.
- Recurso de outro usuário se comporta como inexistente: o use case devolve `...NotFoundError` (**404**, nunca 403).
- Ao criar algo que pertence a um veículo (abastecimento, despesa, manutenção, plano), o use case busca o veículo com `vehicleRepository.findById(vehicleId, userId)`.
- Cron e filas não têm usuário. Eles usam métodos com nome explícito: `findByIdForSystem(id)`, `findAllActive...()`.
- IDs de domínio são UUID v4, validados nos controllers com `ParseUUIDPipe({ version: '4' })`. Os ids de `user` vêm do Better Auth e **não** são UUID.

### Padrão de Erro e Retorno dos Use Cases: `Either<Left, Right>`

Os casos de uso retornam `Either` de `@/core/utils/Either` em vez de lançar exceções:

```ts
import { Either, left, right } from '@/core/utils/Either'

type Response = Either<VehicleNotFoundError | PayloadError, void>

@Injectable()
export class CreateFuelLogUseCase {
  constructor(
    private fuelLogRepository: FuelLogRepository,
    private vehicleRepository: VehicleRepository
  ) {}

  async execute(userId: string, data: CreateFuelLogPayload): Promise<Response> {
    const vehicle = await this.vehicleRepository.findById(
      data.vehicleId,
      userId
    )

    if (!vehicle) {
      return left(new VehicleNotFoundError())
    }

    const fuelLog = FuelLogMapper.toDomain(data)

    await this.fuelLogRepository.save(fuelLog)

    return right(void 0)
  }
}
```

### Erros e Tratamento nos Controllers HTTP

Erros de "não encontrado" estendem `NotFoundError` (`@/core/domain/errors/not-found-error`) e erros de validação usam `PayloadError`. O controller não mapeia erro por erro: ele delega ao helper `toHttpException` (`@/infra/http/to-http-exception`):

| Erro do use case | Resposta HTTP |
|---|---|
| `NotFoundError` (e subclasses, como `UserNotFoundError`) | `404 NotFoundException` |
| `PayloadError` | `400 BadRequestException` |
| qualquer outro | `500 InternalServerErrorException('Unexpected error')` (sem vazar a mensagem) |

```ts
@Post()
async create(@Body() data: CreateFuelLogDTO, @CurrentUserId() userId: string) {
  const result = await this.createFuelLogUseCase.execute(userId, data)

  if (result.isLeft()) {
    throw toHttpException(result.value)
  }

  return { message: 'Fuel log created successfully' }
}
```

Escritas respondem `{ message }`; leituras respondem o valor direto (`result.value`).

O `AllExceptionsFilter` (`@/infra/http/all-exceptions.filter`, registrado em `main.ts`) é a rede de segurança para o que escapar dos controllers: `HttpException` mantém status e corpo; erros de domínio soltos passam por `toHttpException` (404/400); qualquer outro erro vira **500 `Unexpected error`**, com a stack no log. Para rejeitar entrada inválida fora de um use case (ex.: `fileFilter` do multer), lance `BadRequestException`, não `Error`.

### Entidades: `update()` Parcial

- A entidade é dona da regra de atualização: o use case chama `entity.update(data)` e **nunca** atribui campo a campo.
- `update()` recebe `Partial<Omit<Props, 'id' | <dono> | 'createdAt' | 'updatedAt'>>`. Campos `undefined` são ignorados (via `omitUndefined`, em `@/core/utils/omit-undefined`); `null` limpa campos anuláveis.
- Validações e normalizações (trim, placa em maiúsculas) ficam dentro da entidade e lançam `PayloadError`.
- Os payloads de update do domínio são `Partial<Omit<CreatePayload, <chave não editável>>>` (ex.: `vehicleId` não muda por update).

### Endpoints

Todos exigem `Authorization: Bearer <session token>` e respondem apenas com dados do usuário da sessão.

| Recurso | Rotas |
|---|---|
| **Users** | `GET /users/:id`, `PATCH /users/:id/upload-avatar`, `GET /users/:id/download-avatar` (somente o próprio usuário; outro id responde 404) |
| **Notifications** | `GET /notifications/inbox-session` (credenciais do Inbox do Novu; `{ enabled: false }` sem Novu) |

Os endpoints do domínio estão planejados na seção 6 do `docs/CONCEPT.md`.

### Passo a Passo para Criar um Novo Módulo

1. **Modelagem:** se necessário, ajuste `packages/lib-my-car-tracker-db/src/prisma/schema.prisma`, acrescente o model ao `prismaMyCarTracker` em `src/index.ts` do lib, crie a migration (`pnpm --filter @lib/my-car-tracker-db migrate`) e rode `pnpm build:db`.
2. **Domain (`src/modules/<nome>/domain`):** entidade (`create()` com defaults e `update()` parcial) e contrato do repositório (`abstract class <Nome>Repository`) com `userId` obrigatório nos métodos que acessam dado do usuário.
3. **Application (`src/modules/<nome>/application`):** casos de uso em `use-cases/` retornando `Promise<Either<AppError, Result>>` e erros em `errors/` (estendendo `NotFoundError` quando for "não encontrado"). Spec ao lado de cada caso de uso.
4. **Infra (`src/modules/<nome>/infra`):** repositório Prisma em `repositories/prisma.<nome>.repository.ts` (token `'prismaMyCarTracker'`) e mapper `prisma.<nome>.mapper.ts`; DTO com class-validator; controller com `@CurrentUserId()`, `ParseUUIDPipe` nos `:id` e `toHttpException`.
5. **Módulo NestJS:** `controllers: [<Nome>Controller]`, use cases nos `providers` e `{ provide: <Nome>Repository, useClass: Prisma<Nome>Repository }`.
6. **Registro global:** importe `<Nome>Module` no `imports` de `AppModule` (`src/app.module.ts`).

---

## 4. Infraestrutura (`src/infra`)

```
infra/
├── auth/          # PrismaSessionStore (o guard e o @CurrentUserId() vêm do @lib/auth/nest)
├── cron/          # CronModule (ScheduleModule); os crons ficam em modules/<nome>/adapters/schedules
├── env/           # Validação (zod) e acesso às variáveis de ambiente
├── events/        # Publisher de eventos de domínio (EventEmitter)
├── http/          # Cliente n8n, toHttpException e AllExceptionsFilter
├── notifications/ # Novu (@novu/api): DomainNotifier, sessão do Inbox (HMAC) e GET /notifications/inbox-session
├── prisma/        # Providers 'prismaMyCarTracker' e 'prismaAuth'
├── queue/         # Publisher de jobs BullMQ (filas em core/domain/queue/queue.constants.ts)
└── storage/       # Cloudflare R2 (upload, download e URLs assinadas)
```

### Notificações (Novu)

- `DomainNotifier` (`core/domain/notifications`) é implementado por `NovuNotifier`: `trigger({ workflowId, to: { subscriberId }, payload, transactionId })`, com o `subscriberId` igual ao id do usuário do Better Auth. Nunca lança: sem `NOVU_SECRET_KEY` devolve `skipped`; erro ou workflow inexistente devolve `failed` com log.
- Os workflows ficam em `NOTIFICATION_WORKFLOWS`. O primeiro previsto é `maintenance-due` (plano preventivo próximo do vencimento ou vencido), que precisa ser criado no Novu com esse identificador.
- `GET /notifications/inbox-session` devolve `applicationIdentifier`, `subscriberId`, `subscriberHash` (HMAC-SHA256) e as URLs da região EU, ou `{ enabled: false }`. A web mostra o `<Inbox>` no header só quando `enabled`.
- Variáveis (opcionais; vazio = desligado): `NOVU_SECRET_KEY`, `NOVU_APPLICATION_IDENTIFIER`, `NOVU_API_URL`, `NOVU_SOCKET_URL`.

### Filas e Cron

`QUEUES` e `JOBS` começam vazios. Para um processamento em background (ex.: o cron diário `evaluate-maintenance-schedules` do conceito), declare a fila em `queue.constants.ts`; o `QueueModule` registra todas automaticamente.

---

## 5. Core (`src/core`)

```
core/
├── domain/
│   ├── errors/        # PayloadError e NotFoundError
│   ├── events/        # Interface DomainEventPublisher
│   ├── notifications/ # Interface DomainNotifier + NOTIFICATION_WORKFLOWS
│   ├── queue/         # Interface DomainJobPublisher + QUEUES e JOBS
│   └── storage/       # Interface DomainStorage + buckets e pastas
├── http/              # SearchParams (paginação, busca e ordenação)
└── utils/             # Either, Optional, omitUndefined, month (MonthRef) e utc-date
```

---

## 6. Testes (Vitest)

| Comando | Descrição |
|---|---|
| `pnpm --filter api test` | Testes unitários (`src/**/*.spec.ts`) |
| `pnpm --filter api test:e2e` | Testes E2E (`test/**/*.e2e-spec.ts`); precisam das variáveis obrigatórias do `.env` |
| `pnpm --filter api test:cov` | Cobertura |

Referências no código: `src/modules/user/application/use-cases/*.spec.ts` (use cases com repositório in-memory) e `test/e2e/users.e2e-spec.ts` (E2E com sessão mockada).

- **Localização:** spec ao lado do arquivo testado; repositórios in-memory em `test/repositories/`; factories em `test/factories/`; fakes de infraestrutura em `test/events/`, `test/notifications/` e `test/storage/`; E2E em `test/e2e/`.
- **In-memory em vez de mocks** nos use cases: asserções sobre estado real (`expect(repository.items).toHaveLength(1)`). Novo repositório no `beforeEach()`.
- **Ownership:** todo caso de uso que lê ou altera um recurso por `id` tem um spec em que outro usuário recebe `...NotFoundError` sem nada mudar. O repositório in-memory reproduz o escopo (`findById(id, userId)`).
- **Entidades:** spec do `update()` parcial cobrindo `undefined`, `null`, normalizações, identidade preservada e `PayloadError`.
- **Either:** teste os dois caminhos (`isRight()` e `isLeft()` com o tipo do erro).
- **Faker:** use `@faker-js/faker` com `override` nas factories, em vez de strings fixas.
- **E2E:** aplique o `ValidationPipe` e o `AllExceptionsFilter` como no `main.ts`; mocke `'prismaAuth'` com `session.findUnique` devolvendo `{ userId, expiresAt }` e envie `Authorization: Bearer <token>`; substitua `'prismaMyCarTracker'` com `.overrideProvider('prismaMyCarTracker')` para não bater no banco.
