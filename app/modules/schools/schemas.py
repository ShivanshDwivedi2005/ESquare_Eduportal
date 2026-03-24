from pydantic import BaseModel, EmailStr


class SchoolRequestCreate(BaseModel):
    school_name: str
    email: EmailStr
    phone: str
    address: str
    admin_name: str
    password: str


class SchoolRequestResponse(BaseModel):
    id: str
    school_name: str
    email: str
    status: str