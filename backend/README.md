# ESQUARE backend

The API is a strict-TypeScript Fastify modular monolith backed exclusively by PostgreSQL. Neon is the target hosted database; SQLite is not supported.

## Local setup

1. Copy `.env.example` to `.env` and configure a Neon development branch.
2. Install dependencies with `npm ci`.
3. Generate the client with `npm run db:generate`.
4. Apply migrations with `npm run db:migrate`.
5. Seed roles, permissions, boards, and optionally the first platform administrator with `npm run db:seed`.
6. Start the API with `npm run dev`.

Use a direct Neon connection for migrations and a pooled connection for `DATABASE_URL` when deploying serverless or horizontally scaled API instances. Both connection strings must use TLS.

The initial migration intentionally drops the former `auth`, `core`, and `academics` schemas. Back up any valuable environment before applying it.
