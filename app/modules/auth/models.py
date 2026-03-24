import uuid
from datetime import datetime

from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base


# USERS TABLE
class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "auth"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    email_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# PASSWORD TABLE
class PasswordCredential(Base):
    __tablename__ = "password_credentials"
    __table_args__ = {"schema": "auth"}

    user_id = Column(UUID(as_uuid=True), ForeignKey("auth.users.id"), primary_key=True)
    password_hash = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow)


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
    email = Column(String, index=True)
    otp = Column(String)
    expires_at = Column(DateTime)
    purpose = Column(String)