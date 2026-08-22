from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from app.core.config import settings


def create_token(data: dict, expires_delta: timedelta, token_type: str) -> str:
    to_encode = data.copy()
    to_encode.update({
        "exp": datetime.now(timezone.utc) + expires_delta,
        "type": token_type,
    })
    return jwt.encode(
        to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM
    )


def create_access_token(data: dict) -> str:
    return create_token(
        data,
        timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
        "access",
    )


def create_email_verification_token(email: str) -> str:
    return create_token(
        {"sub": email.strip().lower()},
        timedelta(minutes=settings.EMAIL_VERIFICATION_EXPIRE_MINUTES),
        "email_verification",
    )


def decode_token(token: str, expected_type: str | None = None):
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        if expected_type and payload.get("type") != expected_type:
            return None
        return payload
    except JWTError:
        return None
