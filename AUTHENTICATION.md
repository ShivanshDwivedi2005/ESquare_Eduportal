# Universal account authentication

Every person creates the same ESQUARE account with a display name, username,
email address, and password. A new account starts in the public workspace.
Active records in `core.school_memberships` determine which additional
role-specific workspace the account can open.

## Database migration

Alembic now owns schema changes; the API no longer calls `create_all` at startup.

For a new, empty PostgreSQL database:

```powershell
pip install -r requirements-auth.txt
alembic upgrade head
```

For an existing ESQUARE database whose tables were previously created by
SQLAlchemy, record the baseline first and then apply the auth migration:

```powershell
alembic stamp 20260822_00
alembic upgrade head
```

The auth migration assigns deterministic temporary usernames to existing
accounts. New accounts must select their own username.

## Auth flow

1. Check `GET /api/v1/auth/usernames/{username}/availability`.
2. Send a code with `POST /api/v1/auth/send-otp`.
3. Verify it with `POST /api/v1/auth/verify-otp`.
4. Pass the returned verification token to `POST /api/v1/auth/signup`.
5. Use the short-lived bearer token for API requests. The rotating refresh token
   is held only in an HttpOnly cookie.

The Bloom filter accelerates negative username lookups. A positive result is
confirmed with PostgreSQL, and the unique database index is always the final
authority during account creation.

Set `REFRESH_COOKIE_SECURE=true` in HTTPS deployments. Configure allowed web
origins with the comma-separated `FRONTEND_ORIGINS` setting.
