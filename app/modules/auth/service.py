import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from google.auth.transport import requests
from google.oauth2 import id_token
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.common.email import send_email_otp
from app.common.jwt import (
    create_access_token,
    create_email_verification_token,
    decode_token,
)
from app.common.otp import generate_otp, hash_otp, verify_otp_hash
from app.common.password import hash_password, verify_password
from app.core.config import settings
from app.modules.auth.bloom import username_index
from app.modules.auth.models import (
    GoogleAccount,
    OTPCode,
    PasswordCredential,
    RefreshSession,
    User,
)
from app.modules.auth.schemas import SignupRequest
from app.modules.auth.username import normalize_username, validate_username
from app.modules.schools.models import Role, SchoolMembership


OTP_PURPOSE_SIGNUP = "signup"
OTP_LIFETIME_MINUTES = 5
OTP_MAX_ATTEMPTS = 5

ROLE_ALIASES = {
    "admissions": "admission",
    "institution_admin": "admin",
}
KNOWN_ROLES = {
    "student",
    "teacher",
    "principal",
    "admin",
    "hr",
    "finance",
    "admission",
    "organization",
}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _normalise_email(email: str) -> str:
    return email.strip().lower()


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _public_id(user: User) -> str:
    return f"ESQ-{user.id.hex[:12].upper()}"


def _roles_for_user(db: Session, user_id) -> list[str]:
    rows = (
        db.query(Role.role_name)
        .join(SchoolMembership, SchoolMembership.role_id == Role.id)
        .filter(
            SchoolMembership.user_id == user_id,
            SchoolMembership.status == "active",
        )
        .order_by(SchoolMembership.joined_at.desc())
        .all()
    )

    roles: list[str] = []
    for (role_name,) in rows:
        role = ROLE_ALIASES.get(role_name, role_name)
        if role in KNOWN_ROLES and role not in roles:
            roles.append(role)
    return roles


def user_payload(db: Session, user: User) -> dict:
    roles = _roles_for_user(db, user.id)
    primary_role = roles[0] if roles else "public"
    return {
        "id": str(user.id),
        "public_id": _public_id(user),
        "display_name": user.display_name,
        "username": user.username,
        "email": user.email,
        "email_verified": user.email_verified,
        "role": primary_role,
        "roles": roles,
        "association_status": "verified" if roles else "not_connected",
    }


def initialize_username_index(db: Session) -> None:
    usernames = (
        username
        for (username,) in db.query(User.username)
        .filter(User.username.isnot(None))
        .yield_per(5000)
    )
    username_index.rebuild(usernames)


def username_availability(username: str, db: Session) -> dict:
    try:
        normalized = validate_username(username)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    if username_index.ready and not username_index.might_contain(normalized):
        return {"username": normalized, "available": True}

    exists = db.query(User.id).filter(User.username == normalized).first() is not None
    return {"username": normalized, "available": not exists}


async def send_otp_service(email: str, db: Session):
    normalized_email = _normalise_email(email)
    if db.query(User.id).filter(User.email == normalized_email).first():
        raise HTTPException(status_code=409, detail="An account already uses this email")

    now = _utcnow()
    latest_code = (
        db.query(OTPCode)
        .filter(
            OTPCode.email == normalized_email,
            OTPCode.purpose == OTP_PURPOSE_SIGNUP,
        )
        .order_by(OTPCode.created_at.desc())
        .first()
    )
    if latest_code and latest_code.created_at > now - timedelta(seconds=60):
        raise HTTPException(
            status_code=429, detail="Wait a minute before requesting another code"
        )

    active_codes = db.query(OTPCode).filter(
        OTPCode.email == normalized_email,
        OTPCode.purpose == OTP_PURPOSE_SIGNUP,
        OTPCode.consumed_at.is_(None),
    )
    active_codes.update({OTPCode.consumed_at: now}, synchronize_session=False)

    otp = generate_otp()
    otp_entry = OTPCode(
        email=normalized_email,
        otp_hash=hash_otp(normalized_email, otp),
        expires_at=now + timedelta(minutes=OTP_LIFETIME_MINUTES),
        purpose=OTP_PURPOSE_SIGNUP,
    )
    db.add(otp_entry)
    db.commit()

    try:
        await send_email_otp(normalized_email, otp)
    except Exception as exc:
        db.delete(otp_entry)
        db.commit()
        raise HTTPException(
            status_code=502, detail="We could not send the verification email"
        ) from exc

    return {"message": "Verification code sent"}


def verify_otp_service(email: str, otp: str, db: Session):
    normalized_email = _normalise_email(email)
    record = (
        db.query(OTPCode)
        .filter(
            OTPCode.email == normalized_email,
            OTPCode.purpose == OTP_PURPOSE_SIGNUP,
            OTPCode.consumed_at.is_(None),
        )
        .order_by(OTPCode.created_at.desc())
        .first()
    )

    if not record:
        raise HTTPException(status_code=400, detail="Request a new verification code")

    now = _utcnow()
    if record.expires_at < now:
        record.consumed_at = now
        db.commit()
        raise HTTPException(status_code=400, detail="Verification code expired")

    if record.attempts >= OTP_MAX_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Request a new verification code")

    if not verify_otp_hash(normalized_email, otp, record.otp_hash):
        record.attempts += 1
        if record.attempts >= OTP_MAX_ATTEMPTS:
            record.consumed_at = now
        db.commit()
        raise HTTPException(status_code=400, detail="That verification code is not correct")

    record.consumed_at = now
    db.commit()
    return {
        "message": "Email verified",
        "verification_token": create_email_verification_token(normalized_email),
    }


def _create_refresh_session(
    db: Session, user_id, user_agent: str | None = None
) -> tuple[str, RefreshSession]:
    raw_token = secrets.token_urlsafe(48)
    session = RefreshSession(
        user_id=user_id,
        token_hash=_token_hash(raw_token),
        expires_at=_utcnow()
        + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        user_agent=(user_agent or "")[:255] or None,
    )
    db.add(session)
    db.flush()
    return raw_token, session


def _auth_result(
    db: Session, user: User, refresh_token: str
) -> tuple[dict, str]:
    return (
        {
            "access_token": create_access_token({"sub": str(user.id)}),
            "token_type": "bearer",
            "user": user_payload(db, user),
        },
        refresh_token,
    )


def signup_service(
    data: SignupRequest, db: Session, user_agent: str | None = None
) -> tuple[dict, str]:
    email = _normalise_email(str(data.email))
    username = normalize_username(data.username)
    verification = decode_token(data.verification_token, "email_verification")
    if not verification or verification.get("sub") != email:
        raise HTTPException(
            status_code=400, detail="Verify this email address before creating the account"
        )

    if db.query(User.id).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="An account already uses this email")

    if username_index.might_contain(username):
        if db.query(User.id).filter(User.username == username).first():
            raise HTTPException(status_code=409, detail="That username is already taken")

    try:
        user = User(
            email=email,
            username=username,
            display_name=data.display_name,
            email_verified=True,
        )
        db.add(user)
        db.flush()
        db.add(
            PasswordCredential(
                user_id=user.id,
                password_hash=hash_password(data.password),
            )
        )
        refresh_token, _ = _create_refresh_session(db, user.id, user_agent)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        conflict = db.query(User.id).filter(User.username == username).first()
        detail = (
            "That username is already taken"
            if conflict
            else "An account already uses this email"
        )
        raise HTTPException(status_code=409, detail=detail) from exc

    db.refresh(user)
    username_index.add(username)
    return _auth_result(db, user, refresh_token)


def login_service(
    identifier: str,
    password: str,
    db: Session,
    user_agent: str | None = None,
) -> tuple[dict, str]:
    normalized = identifier.strip().lower()
    user = db.query(User).filter(
        or_(User.email == normalized, User.username == normalized)
    ).first()

    if not user:
        raise HTTPException(status_code=401, detail="Email, username, or password is incorrect")

    credential = db.query(PasswordCredential).filter(
        PasswordCredential.user_id == user.id
    ).first()
    if not credential or not verify_password(password, credential.password_hash):
        raise HTTPException(status_code=401, detail="Email, username, or password is incorrect")

    refresh_token, _ = _create_refresh_session(db, user.id, user_agent)
    db.commit()
    return _auth_result(db, user, refresh_token)


def refresh_service(
    raw_token: str | None, db: Session, user_agent: str | None = None
) -> tuple[dict, str]:
    if not raw_token:
        raise HTTPException(status_code=401, detail="Sign in required")

    now = _utcnow()
    session = (
        db.query(RefreshSession)
        .filter(RefreshSession.token_hash == _token_hash(raw_token))
        .with_for_update()
        .first()
    )
    if not session or session.revoked_at or session.expires_at <= now:
        raise HTTPException(status_code=401, detail="Session expired")

    user = db.query(User).filter(User.id == session.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Session expired")

    session.revoked_at = now
    new_token, new_session = _create_refresh_session(db, user.id, user_agent)
    db.flush()
    session.replaced_by = new_session.id
    db.commit()
    return _auth_result(db, user, new_token)


def logout_service(raw_token: str | None, db: Session) -> None:
    if not raw_token:
        return
    session = db.query(RefreshSession).filter(
        RefreshSession.token_hash == _token_hash(raw_token),
        RefreshSession.revoked_at.is_(None),
    ).first()
    if session:
        session.revoked_at = _utcnow()
        db.commit()


def google_login_service(
    token: str,
    db: Session,
    user_agent: str | None = None,
) -> tuple[dict, str]:
    try:
        idinfo = id_token.verify_oauth2_token(
            token, requests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Google sign-in failed") from exc

    email = _normalise_email(idinfo["email"])
    google_sub = idinfo["sub"]
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=409,
            detail="Create your ESQUARE account before connecting Google",
        )

    account = db.query(GoogleAccount).filter(
        GoogleAccount.google_sub == google_sub
    ).first()
    if account and account.user_id != user.id:
        raise HTTPException(status_code=409, detail="Google account is already connected")
    if not account:
        db.add(GoogleAccount(user_id=user.id, google_sub=google_sub))

    refresh_token, _ = _create_refresh_session(db, user.id, user_agent)
    db.commit()
    return _auth_result(db, user, refresh_token)
