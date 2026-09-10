# ESQUARE backend

The API is a strict-TypeScript Fastify modular monolith backed exclusively by PostgreSQL. Neon is the target hosted database; SQLite is not supported.

## Local setup

1. Configure the repository-level `../.env`. The backend accepts the legacy
   `JWT_SECRET`, `JWT_EXPIRE_MINUTES`, `SMTP_EMAIL`, and `SMTP_PASSWORD` names
   and maps them to its current configuration. Explicit current variable names
   still take precedence.
2. Install dependencies with `npm ci`.
3. Generate the client with `npm run db:generate`.
4. Apply migrations with `npm run db:migrate`.
5. Seed roles, permissions, boards, and optionally the first platform administrator with `npm run db:seed`.
6. Start the API with `npm run dev`.

When upgrading a database created by the legacy backend, run
`npm run db:preserve-legacy` before the first migration, then run the normal
migration and seed commands followed by `npm run db:import-legacy`. The preserve
step renames the former schemas and conflicting project-management `boards`
table instead of deleting them.

Use a direct Neon connection for migrations and a pooled connection for `DATABASE_URL` when deploying serverless or horizontally scaled API instances. Both connection strings must use TLS.

The initial migration intentionally drops the former `auth`, `core`, and `academics` schemas. Back up any valuable environment before applying it.

## Google login and signup

Set `GOOGLE_CLIENT_ID` in the repository-level `.env` to an OAuth 2.0 **Web application** client ID. In Google Cloud Console, add every frontend origin that displays the Google button under **Authorized JavaScript origins**. Local development normally needs:

- `http://localhost:8080`
- `http://127.0.0.1:8080` if the app is opened with that address

Also add the deployed frontend origin. If the OAuth consent screen is in **Testing**, add each Google account that will sign in as a test user. A Google client secret is not used by this browser ID-token flow. Restart both development servers after changing `.env`.

## Production safeguards

- Set `NODE_ENV=production`, `APP_ENV=production`, `COOKIE_SECURE=true`, and use an HTTPS `APP_BASE_URL`.
- Use different 32+ character secrets for access and refresh tokens.
- Both database URLs must be PostgreSQL TLS URLs; `DIRECT_DATABASE_URL` is required for migrations.
- Run `npm run check` and `npm audit` before deployment. The GitHub Actions workflow enforces validation, tests, builds, and high-severity dependency audits.
- Apply the destructive initial migration only to a reviewed Neon branch after taking any required backup.
