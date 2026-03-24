from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import date
from typing import Optional


class StudentCreate(BaseModel):
    school_id: UUID

    email: EmailStr
    password: str

    first_name: str
    last_name: Optional[str] = None
    dob: date
    gender: Optional[str] = None

    phone: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    address: Optional[str] = None