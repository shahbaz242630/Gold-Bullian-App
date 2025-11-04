# Bulliun Digital Gold Platform - Architecture Overview

## Monorepo Layout

The project follows a TypeScript-first monorepo structure to keep mobile, web, and backend codebases aligned while enabling package sharing.

```
/
|-- backend/            # NestJS services, workers, migrations, shared backend libs
|   |-- services/
|   |   `-- core-api/   # Primary REST/GraphQL API for B2C/B2B/admin clients
|   |-- libs/           # Auth, payments, gold pricing, and domain modules
|   `-- prisma/         # Database schema and migrations (PostgreSQL/Supabase)
|-- frontend/           # React Native (Expo) + Next.js apps, design system
|   |-- apps/
|   |   |-- consumer/   # Mobile/web consumer experience
|   |   |-- admin/      # Internal operations portal
|   |   `-- partner/    # B2B partner dashboard / web app
|   `-- packages/       # UI kit, hooks, localization, analytics utilities
|-- packages/           # Cross-cutting TypeScript packages reused everywhere
|   |-- config/         # Shared config loading, environment schemas
|   |-- types/          # API contracts, domain DTOs, generated clients
|   |-- eslint-config/  # Linting rules to enforce consistent standards
|   `-- tooling/        # Scripts for codegen, dev tooling, lint-staged hooks
|-- infrastructure/     # Cloud infra, IaC, CI/CD, deployment manifests
|   |-- cicd/           # GitHub Actions workflows, reusable pipelines
|   `-- terraform/      # AWS/GCP/Supabase provisioning (placeholder)
|-- docs/               # Product and technical documentation
|-- .github/            # Issue templates, default CODEOWNERS, CI workflows
|-- package.json        # Workspace configuration, dev dependencies
|-- turbo.json          # Task pipeline definition (build/test/lint)
`-- tsconfig.base.json  # Root TypeScript config shared across packages
```

## Backend Foundations

- **Framework:** NestJS (TypeScript) for the primary API, emphasizing modular architecture and dependency injection.
- **Database:** PostgreSQL via Supabase; Prisma manages schema, migrations, and typed access.
- **Messaging & Jobs:** Ready for adoption of queues (SQS/RabbitMQ) and scheduled jobs via Bull queues or Cloud Run Jobs.
- **Auth & Security:** JWT access tokens, refresh rotation, RBAC per tenant, and auditing middleware. Secrets sourced from environment variables, validated with Zod schemas.
- **API Style:** REST for mobile/web clients, GraphQL or tRPC for partner SDKs as future extensions. OpenAPI is generated continuously for client SDK generation.
- **Testing:** Jest/Testing Library for unit/integration tests, Pact for contract testing, supertest for e2e of API modules.
- **Core modules (current):**
  - `DatabaseModule` wraps Prisma client for dependency injection & lifecycle hooks.
  - `SupabaseModule` centralises the service-role Supabase client.
  - `UsersModule` encapsulates user persistence and default wallet provisioning.
  - `AuthModule` orchestrates registration/login flows via Supabase and Prisma.

## Frontend Foundations

- **Stack Options:** Expo for mobile (React Native) with React Native Web to share component primitives with Next.js web apps.
- **UI System:** Shared design system package exposing brand tokens, theming, and reusable components tuned for both mobile and web surfaces.
- **State/Data:** TanStack Query for server state, Zustand or Redux Toolkit for local domain state, with service hooks generated from OpenAPI/TSDK.
- **App Targets:** Consumer app (mobile-first), admin web app (Next.js), partner dashboard (Next.js) with SSO/OAuth support.

## Infrastructure & DevOps

- **CI/CD:** GitHub Actions driving lint/test/build across workspaces; deployment jobs targeting AWS ECS/Fargate or Google Cloud Run; Expo EAS for mobile builds.
- **Environment Management:** `.env` per service, managed secrets via AWS Secrets Manager/GCP Secret Manager. `packages/config` centralizes validation to prevent misconfiguration.
- **Observability:** Sentry for error tracking, Datadog/Grafana optional; structured logging via Pino, metrics via OpenTelemetry exporters.
- **Security Baseline:** Commit hooks enforce lint/test, dependency scanning via npm audit + Snyk (optional). Infrastructure templates assume private VPC, managed Postgres (Supabase), and secure storage for documents (S3/Supabase Storage).

## Next Steps

1. Scaffold the NestJS backend (`backend/services/core-api`) with Prisma and CI hooks.
2. Initialize shared packages (`packages/config`, `packages/types`) with strict linting/testing.
3. Provision base CI workflow and environment scaffolding (dotenv templates, lint-staged, Husky).
4. Bootstrap frontend workspace once design system decisions are finalized.



