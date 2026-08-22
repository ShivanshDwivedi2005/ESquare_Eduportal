from fastapi import APIRouter, Cookie, Depends, Request, Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.dependencies.auth import get_current_user
from app.dependencies.database import get_db
from app.modules.auth.models import User
from app.modules.auth.schemas import (
    AuthResponse,
    GoogleLoginRequest,
    LoginRequest,
    MessageResponse,
    SendOTPRequest,
    SignupRequest,
    UserResponse,
    UsernameAvailabilityResponse,
    VerifyOTPRequest,
    VerifyOTPResponse,
)
from app.modules.auth.service import (
    google_login_service,
    login_service,
    logout_service,
    refresh_service,
    send_otp_service,
    signup_service,
    user_payload,
    username_availability,
    verify_otp_service,
)


router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])
REFRESH_COOKIE_NAME = "esquare_refresh"
REFRESH_COOKIE_PATH = "/api/v1/auth"


def _user_agent(request: Request) -> str | None:
    return request.headers.get("user-agent")


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        httponly=True,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite="lax",
        path=REFRESH_COOKIE_PATH,
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        httponly=True,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite="lax",
        path=REFRESH_COOKIE_PATH,
    )


@router.get(
    "/usernames/{username}/availability",
    response_model=UsernameAvailabilityResponse,
)
def check_username(username: str, db: Session = Depends(get_db)):
    return username_availability(username, db)


@router.post("/send-otp", response_model=MessageResponse)
async def send_otp(data: SendOTPRequest, db: Session = Depends(get_db)):
    return await send_otp_service(str(data.email), db)


@router.post("/verify-otp", response_model=VerifyOTPResponse)
def verify_otp(data: VerifyOTPRequest, db: Session = Depends(get_db)):
    return verify_otp_service(str(data.email), data.otp, db)


@router.post("/signup", response_model=AuthResponse, status_code=201)
def signup(
    data: SignupRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    payload, refresh_token = signup_service(data, db, _user_agent(request))
    _set_refresh_cookie(response, refresh_token)
    return payload


@router.post("/login", response_model=AuthResponse)
def login(
    data: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    payload, refresh_token = login_service(
        data.identifier, data.password, db, _user_agent(request)
    )
    _set_refresh_cookie(response, refresh_token)
    return payload


@router.post("/refresh", response_model=AuthResponse)
def refresh(
    request: Request,
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
    db: Session = Depends(get_db),
):
    payload, next_refresh_token = refresh_service(
        refresh_token, db, _user_agent(request)
    )
    _set_refresh_cookie(response, next_refresh_token)
    return payload


@router.post("/logout", response_model=MessageResponse)
def logout(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME),
    db: Session = Depends(get_db),
):
    logout_service(refresh_token, db)
    _clear_refresh_cookie(response)
    return {"message": "Signed out"}


@router.get("/me", response_model=UserResponse)
def me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_payload(db, current_user)


@router.post("/google-login", response_model=AuthResponse)
def google_login(
    data: GoogleLoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    payload, refresh_token = google_login_service(
        data.token, db, _user_agent(request)
    )
    _set_refresh_cookie(response, refresh_token)
    return payload
