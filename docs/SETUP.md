# Setup Guide

## Prerequisites

- Node.js 20.10+
- npm 10.8+
- Supabase project with Postgres + storage
- GitHub CLI (optional) for repository setup

## Initialisation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/shahbaz242630/Gold-Bullian-App.git
   cd Gold-Bullian-App
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment templates:
   ```bash
   cp backend/services/core-api/.env.example backend/services/core-api/.env
   ```
   Fill in secrets from Supabase (service role key, database URL, cookie secret).
4. Run Prisma migrations:
   ```bash
   npm run migrate --workspace=@bulliun/core-api
   ```
5. Start the backend API:
   ```bash
   npm run start:dev --workspace=@bulliun/core-api
   ```
6. Launch the Expo app:
   ```bash
   cd frontend/apps/consumer
   npm install
   npm run start
   ```

## CI/CD

- GitHub Actions workflow `.github/workflows/ci.yml` runs linting, tests, and type checks.
- Deployment jobs (to be added) will target AWS Fargate or Google Cloud Run.

## Tooling Summary

- **Turbo** orchestrates build, lint, and test tasks across packages.
- **Prisma** manages database schema and migrations under `backend/prisma`.
- **Vitest** provides unit testing for backend and shared packages.
- **Husky** + **lint-staged** enforce pre-commit quality gates.


