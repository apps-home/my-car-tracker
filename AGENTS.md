# AGENTS.md — My Car Tracker Monorepo

> Context file for AI coding assistants working on this monorepo.

@docs/CONCEPT.md
@apps/service/AGENTS.md
@apps/web/AGENTS.md
@packages/lib-my-car-tracker-db/AGENTS.md
@packages/lib-auth/AGENTS.md
@packages/lib-ui/AGENTS.md

---

## 1. Project Overview

**My Car Tracker** centralizes the information about the user's car: fuel logs, expenses (tolls, parking, IPVA, insurance, fines), workshop visits and preventive maintenance plans by time and mileage. It replaces notes kept on the phone, so the web is **Mobile-First** for quick entries and desktop-friendly for history and charts. The full concept is in `docs/CONCEPT.md`.

The system is independent: own repository, database (`my_car_tracker_db`), users, Redis, Novu application, R2 bucket, n8n webhooks and Sentry project. The shared submodules `@lib/auth` and `@lib/ui` are tools only and know nothing about this system.

### Workspace Structure

```
my-car-tracker/
├── apps/
│   ├── service/                # NestJS Backend API (port 3333)
│   └── web/                    # Next.js 16 App Router Frontend (port 3000)
├── packages/
│   ├── config/                 # Shared TS configuration (@my-car-tracker/config)
│   ├── env/                    # Environment variable schemas (@my-car-tracker/env)
│   ├── lib-auth/               # Better Auth: createAuth, Next helpers, React client, NestJS guard (git submodule: @lib/auth)
│   ├── lib-my-car-tracker-db/  # Schema, migrations and Prisma client (@lib/my-car-tracker-db; becomes a git submodule)
│   └── lib-ui/                 # Design system tokens + shadcn components (git submodule: @lib/ui)
├── docs/CONCEPT.md             # Concept, schema, business rules and roadmap
├── .github/workflows/          # deploy-service.yml, deploy-web.yml, sync-development-db.yml
├── pnpm-workspace.yaml         # Workspace configuration, catalog and publicHoistPattern
├── biome.json                  # Root linter/formatter config
├── scripts/check-version.mjs   # Version & submodule catalog mismatch checker
└── package.json
```

---

## 2. Key Technologies

| Layer | Technology |
|---|---|
| **Frontend Framework** | **Next.js 16** (App Router, React 19) |
| **Backend Framework** | **NestJS 12** (Modular Architecture, BullMQ, Redis) |
| **Database & ORM** | **PostgreSQL** with **Prisma 7** (`packages/lib-my-car-tracker-db`) |
| **Styling** | **Tailwind CSS v4**, `tw-animate-css`, shadcn/ui (via `@lib/ui`) |
| **State & Data Fetching** | `@tanstack/react-query`, `@tanstack/react-form`, `nuqs` |
| **Authentication** | **Better Auth** via `@lib/auth` (`cookiePrefix: 'my-car-tracker'`) |
| **Storage** | **Cloudflare R2** (bucket `my-car-tracker`) |
| **Notifications** | **Novu** (In-App Inbox) and **n8n** webhooks (`/webhook/my-car-tracker/...`) |
| **Quality & Linter** | **Biome** (single quotes, no semicolons) |
| **Package Manager** | **pnpm** (workspace monorepo with catalog) |

---

## 3. Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Runs the API and the web in parallel (`dev:service` / `dev:web` for one) |
| `pnpm build:libs` | Builds `@lib/my-car-tracker-db` (Prisma generate + tsc) and `@lib/auth` (tsc). Both are consumed from `dist`: run it after cloning or after changing a lib |
| `pnpm build:service` / `pnpm build:web` | Builds the libs, then the app |
| `pnpm test` / `test:e2e` / `test:cov` | API tests (Vitest) |
| `pnpm check` | Biome lint + format with auto-fix |
| `pnpm check-versions` | Version and catalog consistency across apps and submodules |

---

## 4. Workflow & CI/CD Conventions

- Deploys run on push to `main` (with path filters and `deploy` in the commit message) or manual trigger via `workflow_dispatch`.
- Builds are created via Docker with root context (`context: .`) and checkout with `submodules: recursive`: push the submodules before pushing a commit that moves their pointers.
- Images are published to GitHub Container Registry (`ghcr.io/<owner>/my-car-tracker-api` and `my-car-tracker-web`).
