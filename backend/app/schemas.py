from __future__ import annotations

import re
from datetime import date
from typing import Annotated, Literal
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    StringConstraints,
    field_validator,
    model_validator,
)


def to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(part.capitalize() for part in rest)


class APIModel(BaseModel):
    model_config = ConfigDict(extra="forbid", alias_generator=to_camel, populate_by_name=True)


Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
Phone = Annotated[str, StringConstraints(pattern=r"^\+[1-9]\d{7,14}$")]
RoleCode = Literal[
    "ROOT_ADMIN", "ADMISSION_ADMIN", "FINANCE_ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "STAFF"
]
AcademicStatus = Literal["DRAFT", "ACTIVE", "ARCHIVED"]


class RegisterInput(APIModel):
    email: EmailStr = Field(max_length=254)
    password: str = Field(min_length=12, max_length=128)
    first_name: Name
    middle_name: Name | None = None
    last_name: Name

    @field_validator("email", mode="after")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()

    @field_validator("password")
    @classmethod
    def strong_password(cls, value: str) -> str:
        if (
            not re.search(r"[a-z]", value)
            or not re.search(r"[A-Z]", value)
            or not re.search(r"\d", value)
        ):
            raise ValueError("Password requires upper/lowercase letters and a number")
        return value


class EmailInput(APIModel):
    email: EmailStr = Field(max_length=254)

    @field_validator("email", mode="after")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class VerifyEmailInput(EmailInput):
    code: str = Field(pattern=r"^\d{6}$")


class LoginInput(EmailInput):
    password: str = Field(min_length=1, max_length=128)


class GoogleLoginInput(APIModel):
    credential: str = Field(min_length=100, max_length=10000)


class ResetPasswordInput(APIModel):
    token: str = Field(min_length=40, max_length=100)
    password: str = Field(min_length=12, max_length=128)

    @field_validator("password")
    @classmethod
    def strong_password(cls, value: str) -> str:
        return RegisterInput.strong_password(value)


class InstitutionRequestInput(APIModel):
    institution_name: str = Field(min_length=2, max_length=250)
    institution_type: Literal["SCHOOL", "COLLEGE", "UNIVERSITY", "COACHING", "OTHER"]
    board_id: UUID | None = None
    registration_number: str | None = Field(default=None, min_length=2, max_length=100)
    official_email: EmailStr = Field(max_length=254)
    official_phone: Phone
    address_line1: str = Field(min_length=3, max_length=250)
    address_line2: str | None = Field(default=None, min_length=1, max_length=250)
    city: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)
    postal_code: str = Field(min_length=3, max_length=20)
    country: str = Field(pattern=r"^[A-Za-z]{2}$")
    proof_file_id: UUID | None = None

    @field_validator(
        "institution_name",
        "registration_number",
        "address_line1",
        "address_line2",
        "city",
        "state",
        "postal_code",
        mode="after",
    )
    @classmethod
    def trim(cls, value: str | None) -> str | None:
        return value.strip() if value else value

    @field_validator("official_email", mode="after")
    @classmethod
    def email_lower(cls, value: EmailStr) -> str:
        return str(value).lower()

    @field_validator("country", mode="after")
    @classmethod
    def country_upper(cls, value: str) -> str:
        return value.upper()


class RejectRequestInput(APIModel):
    rejection_reason: str = Field(min_length=10, max_length=1000)


class UpdateRolesInput(APIModel):
    add: list[RoleCode] = Field(default_factory=list, max_length=3)
    remove: list[RoleCode] = Field(default_factory=list, max_length=3)

    @model_validator(mode="after")
    def check_changes(self) -> "UpdateRolesInput":
        if not self.add and not self.remove:
            raise ValueError("At least one role change is required")
        if set(self.add) & set(self.remove):
            raise ValueError("A role cannot be added and removed together")
        return self


class AdminInvitationInput(APIModel):
    email: EmailStr = Field(max_length=254)
    target_role: Literal["ADMISSION_ADMIN", "FINANCE_ADMIN", "PRINCIPAL"]

    @field_validator("email", mode="after")
    @classmethod
    def email_lower(cls, value: EmailStr) -> str:
        return str(value).lower()


class InvitationTokenInput(APIModel):
    token: str = Field(min_length=40, max_length=100)


class CommonOnboarding(APIModel):
    first_name: Name
    middle_name: Name | None = None
    last_name: Name
    email: EmailStr = Field(max_length=254)
    phone: Phone | None = None
    date_of_birth: date | None = None

    @field_validator("email", mode="after")
    @classmethod
    def email_lower(cls, value: EmailStr) -> str:
        return str(value).lower()


class StudentOnboardingInput(CommonOnboarding):
    admission_number: str = Field(min_length=1, max_length=100)
    academic_session_id: UUID
    class_section_id: UUID
    guardian_name: str | None = Field(default=None, min_length=1, max_length=200)
    guardian_phone: Phone | None = None
    admission_date: date


class TeacherOnboardingInput(CommonOnboarding):
    employee_number: str = Field(min_length=1, max_length=100)
    designation: str | None = Field(default=None, min_length=1, max_length=150)
    department: str | None = Field(default=None, min_length=1, max_length=150)
    joining_date: date


class StaffOnboardingInput(TeacherOnboardingInput):
    employee_type: Literal[
        "ADMINISTRATIVE_STAFF", "ACCOUNTANT", "LIBRARIAN", "LAB_ASSISTANT", "SUPPORT_STAFF", "OTHER"
    ]


class AcademicSessionInput(APIModel):
    name: str = Field(min_length=2, max_length=50)
    start_date: date
    end_date: date
    status: AcademicStatus = "DRAFT"

    @model_validator(mode="after")
    def dates(self) -> "AcademicSessionInput":
        if self.end_date <= self.start_date:
            raise ValueError("End date must follow start date")
        return self


class ClassSectionInput(APIModel):
    academic_session_id: UUID
    class_level: str = Field(min_length=1, max_length=50)
    section: str = Field(min_length=1, max_length=20)
    stream: str | None = Field(default=None, min_length=1, max_length=100)
    status: AcademicStatus = "ACTIVE"
