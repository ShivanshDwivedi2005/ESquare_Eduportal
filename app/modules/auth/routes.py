# from fastapi import APIRouter, Depends
# from sqlalchemy.orm import Session
# from app.dependencies.database import get_db
# from app.modules.auth.schemas import GoogleLoginRequest, LoginRequest, SendOTPRequest, SignupRequest, VerifyOTPRequest
# from app.modules.auth.service import google_login_service, login_service, send_otp_service, signup_service, verify_otp_service

# router = APIRouter(prefix="/auth", tags=["Auth"])


# @router.post("/send-otp")
# async def send_otp(data: SendOTPRequest, db: Session = Depends(get_db)):
#     return await send_otp_service(data.email, db)
# @router.post("/verify-otp")
# async def verify_otp(data: VerifyOTPRequest, db: Session = Depends(get_db)):
#     return await verify_otp_service(data.email, data.otp, db)

# @router.post("/signup")
# async def signup(data: SignupRequest, db: Session = Depends(get_db)):
#     return await signup_service(data.email, data.password, db)

# @router.post("/login")
# async def login(data: LoginRequest, db: Session = Depends(get_db)):
#     return await login_service(data.email, data.password, db)

# @router.post("/google-login")
# async def google_login(data: GoogleLoginRequest, db: Session = Depends(get_db)):
#     return await google_login_service(data.token, db)


from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies.database import get_db
from app.modules.auth.schemas import (
    GoogleLoginRequest,
    LoginRequest,
    SendOTPRequest,
    SignupRequest,
    VerifyOTPRequest
)
from app.modules.auth.service import (
    google_login_service,
    login_service,
    send_otp_service,
    signup_service,
    verify_otp_service
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/send-otp")
async def send_otp(data: SendOTPRequest, db: Session = Depends(get_db)):
    return await send_otp_service(data.email, db)


@router.post("/verify-otp")
def verify_otp(data: VerifyOTPRequest, db: Session = Depends(get_db)):
    return verify_otp_service(data.email, data.otp, db)


@router.post("/signup")
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    return signup_service(data.email, data.password, db)


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    return login_service(data.email, data.password, db)


@router.post("/google-login")
def google_login(data: GoogleLoginRequest, db: Session = Depends(get_db)):
    return google_login_service(data.token, db)