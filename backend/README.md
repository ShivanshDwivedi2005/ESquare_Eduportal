# ESQUARE FastAPI backend

The backend is a Python 3.12 FastAPI application backed exclusively by PostgreSQL. It preserves the existing `/api/v1` routes and database schema while using SQLAlchemy transactions, PostgreSQL row-level security, Pydantic validation, Argon2 passwords, rotating refresh sessions, Google ID-token verification, and SMTP mail.

## Local setup

1. Configure the repository-level `../.env`. Existing `JWT_SECRET`, `JWT_EXPIRE_MINUTES`, `SMTP_EMAIL`, and `SMTP_PASSWORD` variables remain supported. `ENVIRONMENT` replaces `NODE_ENV`; `NODE_ENV` remains accepted during migration.
2. Create and activate a Python 3.12 virtual environment.
3. Run `python -m pip install -e ".[dev]"` from `backend/`.
4. For a new database, run `python -m alembic upgrade head`, then `python -m scripts.seed`.
5. For an existing database already migrated by Prisma, run `python -m alembic stamp head` once, then `python -m scripts.seed`.
6. Start the API with `python -m app.server` or `uvicorn app.main:app --reload --port 8000`.

Legacy upgrades use `python -m scripts.preserve_legacy` before the baseline migration and `python -m scripts.import_legacy_data` after seeding. Validate live authentication with `python -m scripts.smoke_auth`.

The interactive API contract is available at `http://localhost:8000/docs` while the server is running.

## Google login

Set `GOOGLE_CLIENT_ID` to an OAuth 2.0 Web application client ID. Add every frontend origin that displays the Google button to the Google Cloud project's Authorized JavaScript origins. The browser sends an ID token to `/api/v1/auth/google`; no Google client secret is used.

## Email delivery

Email verification, password resets, and invitations require `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`. The legacy `SMTP_EMAIL` plus `SMTP_PASSWORD` pair maps to Gmail SMTP automatically.

## Production settings

Set `ENVIRONMENT=production`, `APP_ENV=production`, `COOKIE_SECURE=true`, an HTTPS `APP_BASE_URL`, and distinct secrets of at least 32 characters. `DATABASE_URL` and `DIRECT_DATABASE_URL` must be PostgreSQL TLS URLs. Apply Alembic migrations with the direct URL before starting the API.
