# My Car Tracker — Monorepo

Gastos, abastecimentos e manutenções do seu carro em um lugar: API NestJS e web Next.js 16 (Mobile-First). O conceito, o schema e o roteiro estão em [`docs/CONCEPT.md`](docs/CONCEPT.md).

---

## 📁 Estrutura do Workspace

```
my-car-tracker/
├── apps/
│   ├── service/                # Backend API (NestJS, Prisma, BullMQ, Redis)
│   └── web/                    # Frontend (Next.js 16, React 19, Tailwind CSS v4, shadcn/ui)
├── packages/
│   ├── lib-auth/               # Autenticação Better Auth: web e NestJS (Git Submodule)
│   ├── lib-my-car-tracker-db/  # Schema, migrations e client Prisma do My Car Tracker
│   ├── lib-ui/                 # Design system e componentes shadcn (Git Submodule)
│   ├── config/                 # Configurações compartilhadas (@my-car-tracker/config)
│   └── env/                    # Validação de variáveis de ambiente (@my-car-tracker/env)
├── docs/CONCEPT.md             # Conceito e arquitetura
├── .github/workflows/          # Deploy da API e do web (Oracle VM) e sync PROD → DEV do banco
├── biome.json                  # Linting e formatação
├── pnpm-workspace.yaml         # Workspaces, catálogo e publicHoistPattern
├── scripts/check-version.mjs   # Auditoria de versões e submódulos
└── package.json
```

---

## 🚀 Primeiros Passos

```bash
git submodule update --init --recursive
pnpm install

# Variáveis: copie e preencha os exemplos
cp packages/lib-my-car-tracker-db/.env.example packages/lib-my-car-tracker-db/.env
cp apps/service/.env.example apps/service/.env
cp apps/web/.env.example apps/web/.env

# Libs consumidos pelo dist (Prisma Client + @lib/auth)
pnpm build:libs

# Primeira migration no my_car_tracker_db
pnpm --filter @lib/my-car-tracker-db migrate

pnpm dev
```

## 🧰 Comandos

```bash
pnpm dev:service      # API em desenvolvimento
pnpm dev:web          # Web em desenvolvimento
pnpm build:db         # Prisma generate + build do lib de banco
pnpm build:service    # Build da API
pnpm build:web        # Build do web
pnpm test             # Testes da API
pnpm check            # Biome
pnpm check-versions   # Auditoria de versões e submódulos
```
