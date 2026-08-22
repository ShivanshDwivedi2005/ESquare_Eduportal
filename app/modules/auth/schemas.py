from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.modules.auth.username import validate_username


class SendOTPRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")

class SignupRequest(BaseModel):
    display_name: str = Field(min_length=1, max_length=100)
    username: str
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    verification_token: str

    @field_validator("display_name")
    @classmethod
    def clean_display_name(cls, value: str) -> str:
        value = " ".join(value.split())
        if not value:
            raise ValueError("Display name is required")
        return value

    @field_validator("username")
    @classmethod
    def clean_username(cls, value: str) -> str:
        return validate_username(value)

class LoginRequest(BaseModel):
    identifier: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("identifier")
    @classmethod
    def clean_identifier(cls, value: str) -> str:
        return value.strip().lower()

class GoogleLoginRequest(BaseModel):
    token: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    public_id: str
    display_name: str
    username: str
    email: EmailStr
    email_verified: bool
    role: str
    roles: list[str]
    association_status: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UsernameAvailabilityResponse(BaseModel):
    username: str
    available: bool


class VerifyOTPResponse(BaseModel):
    message: str
    verification_token: str


class MessageResponse(BaseModel):
    message: str
