from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from .config import get_settings
from .errors import ApplicationError

ISSUER = "esquare-api"
AUDIENCE = "esquare-web"
password_hasher = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=1)


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password_hash: str | None, password: str) -> bool:
    try:
        if password_hash and password_hash.startswith("$2"):
            return bcrypt.checkpw(password.encode(), password_hash.encode())
        return bool(password_hash and password_hasher.verify(password_hash, password))
    except (VerificationError, InvalidHashError, ValueError):
        return False


def create_access_token(user_id: str) -> str:
    settings = get_settings()
    now = datetime.now(UTC)
    return jwt.encode(
        {
            "sub": user_id,
            "tokenType": "access",
            "iss": ISSUER,
            "aud": AUDIENCE,
            "iat": now,
            "exp": now + timedelta(minutes=settings.access_token_ttl_minutes),
        },
        settings.jwt_access_secret,
        algorithm="HS256",
    )


def verify_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(
            token,
            get_settings().jwt_access_secret,
            algorithms=["HS256"],
            audience=AUDIENCE,
            issuer=ISSUER,
        )
        return payload.get("sub") if payload.get("tokenType") == "access" else None
    except jwt.PyJWTError:
        return None


def opaque_token() -> str:
    return secrets.token_urlsafe(32)


def verification_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def sha256(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def verification_digest(email: str, code: str) -> str:
    secret = get_settings().jwt_refresh_secret.encode()
    return hmac.new(secret, f"{email}:{code}".encode(), hashlib.sha256).hexdigest()


def verify_google_credential(credential: str) -> dict[str, str]:
    client_id = get_settings().google_client_id
    if not client_id or not client_id.endswith(".apps.googleusercontent.com"):
        raise ApplicationError(503, "GOOGLE_AUTH_UNAVAILABLE", "Google sign-in is not configured")
    try:
        payload = id_token.verify_oauth2_token(credential, google_requests.Request(), client_id)
        if not payload.get("sub") or not payload.get("email") or not payload.get("email_verified"):
            raise ValueError("unverified identity")
        fallback = payload["email"].split("@")[0] or "Google"
        return {
            "subject": str(payload["sub"]),
            "email": str(payload["email"]).strip().lower(),
            "first_name": str(payload.get("given_name") or fallback).strip()[:100],
            "last_name": str(payload.get("family_name") or "Account").strip()[:100],
        }
    except ApplicationError:
        raise
    except Exception as error:
        raise ApplicationError(
            401, "INVALID_GOOGLE_CREDENTIAL", "Google sign-in could not be verified"
        ) from error
