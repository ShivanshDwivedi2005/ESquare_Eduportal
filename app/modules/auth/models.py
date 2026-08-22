import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base


def utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


# USERS TABLE
class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "char_length(username) BETWEEN 3 AND 50",
            name="ck_users_username_length",
        ),
        CheckConstraint(
            "username = lower(username) AND "
            "username ~ '^[a-z0-9_](?:[a-z0-9_.]*[a-z0-9_])?$'",
            name="ck_users_username_format",
        ),
        Index("uq_users_username", "username", unique=True),
        {"schema": "auth"},
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String(50), nullable=False)
    display_name = Column(String(100), nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utcnow_naive, nullable=False)


# PASSWORD TABLE
class PasswordCredential(Base):
    __tablename__ = "password_credentials"
    __table_args__ = {"schema": "auth"}

    user_id = Column(UUID(as_uuid=True), ForeignKey("auth.users.id"), primary_key=True)
    password_hash = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=utcnow_naive)


# GOOGLE LOGIN TABLE
class GoogleAccount(Base):
    __tablename__ = "google_accounts"
    __table_args__ = {"schema": "auth"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("auth.users.id"))
    google_sub = Column(String, unique=True)


# OTP TABLE
class OTPCode(Base):
    __tablename__ = "otp_codes"
    __table_args__ = {"schema": "auth"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, index=True, nullable=False)
    otp_hash = Column(String(64), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    purpose = Column(String(32), nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    consumed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow_naive, nullable=False)


class RefreshSession(Base):
    __tablename__ = "refresh_sessions"
    __table_args__ = (
        Index("ix_refresh_sessions_token_hash", "token_hash", unique=True),
        Index("ix_refresh_sessions_user_id", "user_id"),
        Index("ix_refresh_sessions_expires_at", "expires_at"),
        {"schema": "auth"},
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("auth.users.id", ondelete="CASCADE"),
        nullable=False,
    )
    token_hash = Column(String(64), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=utcnow_naive, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    replaced_by = Column(UUID(as_uuid=True), nullable=True)
    user_agent = Column(String(255), nullable=True)
