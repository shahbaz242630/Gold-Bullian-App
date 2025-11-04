# Bulliun Digital Gold Platform

This repository houses the monorepo for Bulliun's digital gold saving ecosystem, including:

- **Backend services** (`backend/`) powered by NestJS, Prisma, and Supabase.
- **Frontend clients** (`frontend/`) starting with the React Native Expo consumer app for iOS/Android.
- **Shared packages** (`packages/`) for configuration, linting, and cross-cutting utilities.
- **Infrastructure assets** (`infrastructure/`) such as CI/CD definitions and future IaC modules.

## Prerequisites

- Node.js `>= 20.10.0`
- npm `>= 10.8.0`
- Supabase project (for Postgres + storage) and service role key
- GitHub repository: `https://github.com/shahbaz242630/Gold-Bullian-App.git`

## Getting Started

Install workspace dependencies:

```bash
npm install
```

Bootstrap Husky hooks (run once after install):

```bash
npm run prepare
```

### Backend (Core API)

```bash
cd backend/services/core-api
npm run start:dev
```

Environment variables (example) - copy to `backend/services/core-api/.env`:

```
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
COOKIE_SECRET=replace-with-long-random-string
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
CORS_ORIGINS=http://localhost:3000,http://localhost:19006
```

Run Prisma migrations:

```bash
npm run migrate
```

### Mobile App (React Native / Expo)

```bash
cd frontend/apps/consumer
npm install
cp .env.example .env
npm run start
```

Set the Expo environment variables:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=public-anon-key
```

This launches Expo for development across iOS, Android, and web.

## Workflow

- `turbo run lint` - lint all packages
- `turbo run test` - run Vitest suites
- `turbo run build` - compile packages and services

GitHub Actions (`.github/workflows/ci.yml`) mirrors the local flow for pull requests.

## Next Steps

1. Flesh out domain modules in the core API (auth, wallets, pricing, KYC).
2. Scaffold shared UI libraries in `frontend/packages/`.
3. Add Supabase migration workflow and seed scripts.
4. Connect CI/CD to AWS Fargate or Cloud Run deployments.

