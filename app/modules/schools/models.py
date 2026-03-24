import uuid
from sqlalchemy import Column, Integer, Text, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base import Base


class School(Base):
    __tablename__ = "schools"
    __table_args__ = {"schema": "core"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    unique_code = Column(Text, unique=True, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())


class SchoolRegistrationRequest(Base):
    __tablename__ = "school_registration_requests"
    __table_args__ = {"schema": "core"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    school_name = Column(Text, nullable=False)
    email = Column(Text, nullable=False)
    phone = Column(Text)
    address = Column(Text)

    admin_name = Column(Text)
    password_hash = Column(Text, nullable=False)

    status = Column(Text, default="pending")

    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class SchoolMembership(Base):
    __tablename__ = "school_memberships"
    __table_args__ = {"schema": "core"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(UUID(as_uuid=True), ForeignKey("auth.users.id"))
    school_id = Column(UUID(as_uuid=True), ForeignKey("core.schools.id"))
    role_id = Column(Integer, ForeignKey("core.roles.id"))

    status = Column(Text, default="active")
    joined_at = Column(TIMESTAMP, server_default=func.now())


from sqlalchemy import Column, Integer, Text

class Role(Base):
    __tablename__ = "roles"
    __table_args__ = {"schema": "core"}

    id = Column(Integer, primary_key=True, index=True)
    role_name = Column(Text, unique=True)