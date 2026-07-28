# My NDIS Portal

NDIS Invoice Management System — participant, provider, invoice, and rate-set
management, with NDIS Excel pricing import.

## Stack
Next.js (App Router) · TypeScript · PostgreSQL + Kysely · MinIO · Ant Design · TailwindCSS

## Prerequisites
- Node.js v24.x
- Docker (for Postgres + MinIO) — or point `.env` at your own instances
- `psql` CLI on your PATH (used by `npm run db:migrate`)

## Setup

```bash
npm install
cp .env.example .env      # already done if you cloned this scaffold as-is

# Start Postgres + MinIO
npm run db:up

# Apply schema + seed data
npm run db:migrate

# Generate Kysely types from the live database
npm run db:codegen

# Run the app
npm run dev
```

App runs at http://localhost:3000
MinIO console at http://localhost:9001 (user: `ndis_minio` / pass: `ndis_minio_secret`)

Default login (from seed data): `test@wittydata.com` — password hash is already
seeded; see `db/migrations/002_seed.sql`. Set the actual password via the
argon2 hash used there, or reset it once auth is implemented.

## Project structure

```
/app            Next.js routes (pages + API routes)
/modules        Feature modules (client, provider, invoice, rate-set, auth, ...)
/services       Business logic, orchestration
/repositories   Data access (Kysely queries)
/db             Kysely client, generated types, SQL migrations
/lib            Cross-cutting infra: s3 (MinIO), ai, auth helpers
```

## Database
Schema is defined in `db/migrations/001_schema.sql` (provided spec — not
modified). Seed data (RBAC roles/permissions, default super admin user) is in
`db/migrations/002_seed.sql`.

## Environment variables
See `.env.example` for the full list (DB connection, MinIO credentials,
AI provider keys for invoice extraction).

## Assumptions & Trade-offs
_(fill in as you build — required in the final README per the assessment brief)_

## Status
Scaffold only. See project brief for the feature checklist:
- [ ] Client management
- [ ] Provider management
- [ ] Invoice management
- [ ] Rate set management + NDIS Excel import
- [ ] User management / Auth / RBAC / Audit logging
- [ ] AI PDF invoice extraction
