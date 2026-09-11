from __future__ import annotations

import hashlib
import os
import re
from functools import lru_cache
from pathlib import Path
from typing import Literal
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from dotenv import load_dotenv
from pydantic import (
    AliasChoices,
    BaseModel,
    ConfigDict,
    Field,
    HttpUrl,
    field_validator,
    model_validator,
)


def _first(*values: str | None) -> str | None:
    return next((value.strip() for value in values if value and value.strip()), None)


def _derived_secret(source: str, purpose: str) -> str:
    return hashlib.sha256(f"esquare:{purpose}:{source}".encode()).hexdigest()


def _database_url(value: str) -> str:
    parts = urlsplit(value)
    query = [(key, item) for key, item in parse_qsl(parts.query) if key != "schema"]
    scheme = "postgresql+psycopg" if parts.scheme in {"postgres", "postgresql"} else parts.scheme
    return urlunsplit((scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


def _direct_database_url(value: str) -> str:
    parts = urlsplit(value)
    return urlunsplit(
        (
            parts.scheme,
            parts.netloc.replace("-pooler.", "."),
            parts.path,
            parts.query,
            parts.fragment,
        )
    )


def _load_environment() -> None:
    backend = Path(__file__).resolve().parents[1]
    for candidate in (backend.parent / ".env", backend / ".env", Path.cwd() / ".env"):
        if candidate.exists():
            load_dotenv(candidate, override=False)
            break


class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")

    environment: Literal["development", "test", "production"] = Field(
        default="development", validation_alias=AliasChoices("ENVIRONMENT", "NODE_ENV")
    )
    app_env: Literal["development", "staging", "production"] = Field(
        default="development", validation_alias="APP_ENV"
    )
    host: str = Field(default="0.0.0.0", validation_alias="HOST")
    port: int = Field(default=8000, ge=1, le=65535, validation_alias="PORT")
    database_url: str = Field(validation_alias="DATABASE_URL")
    direct_database_url: str | None = Field(default=None, validation_alias="DIRECT_DATABASE_URL")
    jwt_access_secret: str = Field(min_length=32, validation_alias="JWT_ACCESS_SECRET")
    jwt_refresh_secret: str = Field(min_length=32, validation_alias="JWT_REFRESH_SECRET")
    access_token_ttl_minutes: int = Field(
        default=15, ge=5, le=60, validation_alias="ACCESS_TOKEN_TTL_MINUTES"
    )
    refresh_token_ttl_days: int = Field(
        default=30, ge=1, le=90, validation_alias="REFRESH_TOKEN_TTL_DAYS"
    )
    invitation_ttl_hours: int = Field(
        default=72, ge=1, le=168, validation_alias="INVITATION_TTL_HOURS"
    )
    email_verification_ttl_minutes: int = Field(
        default=15, ge=5, le=60, validation_alias="EMAIL_VERIFICATION_TTL_MINUTES"
    )
    password_reset_ttl_minutes: int = Field(
        default=30, ge=5, le=60, validation_alias="PASSWORD_RESET_TTL_MINUTES"
    )
    cors_origins: str = Field(
        default="http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173,http://127.0.0.1:5173",
        validation_alias="CORS_ORIGINS",
    )
    cookie_secure: bool = Field(default=False, validation_alias="COOKIE_SECURE")
    trust_proxy: bool = Field(default=False, validation_alias="TRUST_PROXY")
    app_base_url: HttpUrl = Field(default="http://localhost:8080", validation_alias="APP_BASE_URL")
    smtp_host: str | None = Field(default=None, validation_alias="SMTP_HOST")
    smtp_port: int = Field(default=587, ge=1, le=65535, validation_alias="SMTP_PORT")
    smtp_user: str | None = Field(default=None, validation_alias="SMTP_USER")
    smtp_password: str | None = Field(default=None, validation_alias="SMTP_PASSWORD")
    smtp_from: str | None = Field(default=None, validation_alias="SMTP_FROM")
    google_client_id: str | None = Field(default=None, validation_alias="GOOGLE_CLIENT_ID")

    @field_validator("database_url", "direct_database_url", mode="before")
    @classmethod
    def validate_database_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if not value.lower().startswith(("postgres://", "postgresql://", "postgresql+psycopg://")):
            raise ValueError("A PostgreSQL connection string is required")
        return _database_url(value)

    @model_validator(mode="after")
    def validate_security(self) -> "Settings":
        if self.jwt_access_secret == self.jwt_refresh_secret:
            raise ValueError("Access and refresh secrets must differ")
        origins = self.origins
        if "*" in origins:
            raise ValueError("Wildcard CORS is forbidden")
        if self.environment == "production":
            if not self.cookie_secure or not self.direct_database_url:
                raise ValueError("Secure cookies and DIRECT_DATABASE_URL are required")
            if not str(self.app_base_url).startswith("https://"):
                raise ValueError("HTTPS application URL is required")
            for value in (self.database_url, self.direct_database_url):
                if value and not re.search(
                    r"[?&]sslmode=(require|verify-ca|verify-full)(?:&|$)", value, re.I
                ):
                    raise ValueError("PostgreSQL TLS is required")
        return self

    @property
    def origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    _load_environment()
    environment = dict(os.environ)
    database_url = _first(environment.get("DATABASE_URL"))
    if database_url and not _first(environment.get("DIRECT_DATABASE_URL")):
        environment["DIRECT_DATABASE_URL"] = _direct_database_url(database_url)
    legacy_secret = _first(environment.get("JWT_SECRET"))
    if legacy_secret:
        environment.setdefault("JWT_ACCESS_SECRET", _derived_secret(legacy_secret, "access"))
        environment.setdefault("JWT_REFRESH_SECRET", _derived_secret(legacy_secret, "refresh"))
    environment.setdefault("ACCESS_TOKEN_TTL_MINUTES", environment.get("JWT_EXPIRE_MINUTES", "15"))
    smtp_email = _first(environment.get("SMTP_EMAIL"))
    if smtp_email and _first(environment.get("SMTP_PASSWORD")):
        environment.setdefault("SMTP_HOST", "smtp.gmail.com")
        environment.setdefault("SMTP_PORT", "587")
        environment.setdefault("SMTP_USER", smtp_email)
        environment.setdefault("SMTP_FROM", smtp_email)
    return Settings.model_validate(environment)
