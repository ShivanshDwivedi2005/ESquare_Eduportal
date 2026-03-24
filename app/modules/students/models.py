from sqlalchemy import Column, Date, String, ForeignKey, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.db.base_class import Base
 


class Student(Base):
    __tablename__ = "students"
    __table_args__ = {"schema": "academics"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    school_id = Column(UUID(as_uuid=True), ForeignKey("core.schools.id"))
    membership_id = Column(UUID(as_uuid=True), ForeignKey("core.school_memberships.id"))

    student_unique_id = Column(String, unique=True, nullable=False)

    created_at = Column(TIMESTAMP, server_default=func.now())

class StudentProfile(Base):
    __tablename__ = "student_profiles"
    __table_args__ = {"schema": "academics"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    student_id = Column(UUID(as_uuid=True), ForeignKey("academics.students.id"), unique=True)
    school_id = Column(UUID(as_uuid=True), ForeignKey("core.schools.id"))

    first_name = Column(String, nullable=False)
    last_name = Column(String)
    dob = Column(Date, nullable=False)
    gender = Column(String)

    phone = Column(String)
    parent_name = Column(String)
    parent_phone = Column(String)

    address = Column(String)

    admission_date = Column(TIMESTAMP, server_default=func.now())