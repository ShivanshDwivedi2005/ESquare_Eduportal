from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy import text

from .audit import write_audit
from .config import get_settings
from .database import row, rows, transaction
from .dependencies import UserActor, authenticated_actor, client_ip, rate_limiter
from .errors import ApplicationError
from .mail import send_password_reset, send_verification
from .schemas import (
    EmailInput,
    GoogleLoginInput,
    LoginInput,
    RegisterInput,
    ResetPasswordInput,
    VerifyEmailInput,
)
from .security import (
    create_access_token,
    hash_password,
    opaque_token,
    sha256,
    verification_code,
    verification_digest,
    verify_google_credential,
    verify_password,
)

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])
COOKIE_NAME = "esquare_refresh"
COOKIE_PATH = "/api/v1/auth"
GENERIC_REGISTRATION = "If this address can be registered, a verification code has been sent"
GENERIC_RESET = "If an eligible account exists, a password reset message has been sent"


def _set_refresh_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        COOKIE_NAME,
        token,
        path=COOKIE_PATH,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=settings.refresh_token_ttl_days * 86400,
    )


def _trusted_origin(request: Request) -> None:
    if request.headers.get("origin") not in get_settings().origins:
        raise ApplicationError(403, "UNTRUSTED_ORIGIN", "Request origin is not allowed")


def _public_id(user_id: str) -> str:
    return f"ESQ-{user_id.replace('-', '')[:12].upper()}"


def user_view(user_id: str) -> dict:
    with transaction(user_id=user_id) as connection:
        user = row(
            connection,
            """
            SELECT u.user_id, u.email, u.phone, u.status, u.email_verified_at,
                   p.first_name, p.middle_name, p.last_name, p.date_of_birth,
                   p.gender, p.profile_photo_file_id
            FROM users u LEFT JOIN user_profiles p USING(user_id)
            WHERE u.user_id=:user_id
        """,
            {"user_id": user_id},
        )
        if not user:
            raise ApplicationError(404, "USER_NOT_FOUND", "User not found")
        memberships = rows(
            connection,
            """
            SELECT m.membership_id, m.status, i.institution_id, i.institution_code,
                   i.institution_name, i.status AS institution_status,
                   COALESCE(array_agg(r.role_code ORDER BY r.role_code)
                     FILTER (WHERE r.role_code IS NOT NULL), '{}') AS roles
            FROM institution_memberships m
            JOIN institutions i USING(institution_id)
            LEFT JOIN membership_roles mr USING(membership_id)
            LEFT JOIN roles r USING(role_id)
            WHERE m.user_id=:user_id AND m.status='ACTIVE'
            GROUP BY m.membership_id, i.institution_id
            ORDER BY m.joined_at ASC
        """,
            {"user_id": user_id},
        )
    profile = None
    if user["first_name"] is not None:
        profile = {
            key: user[key]
            for key in (
                "first_name",
                "middle_name",
                "last_name",
                "date_of_birth",
                "gender",
                "profile_photo_file_id",
            )
        }
    return {
        "userId": str(user["user_id"]),
        "publicId": _public_id(str(user["user_id"])),
        "email": user["email"],
        "phone": user["phone"],
        "status": user["status"],
        "emailVerifiedAt": user["email_verified_at"],
        "profile": (
            {
                "firstName": profile["first_name"],
                "middleName": profile["middle_name"],
                "lastName": profile["last_name"],
                "dateOfBirth": profile["date_of_birth"],
                "gender": profile["gender"],
                "profilePhotoFileId": profile["profile_photo_file_id"],
            }
            if profile
            else None
        ),
        "memberships": [
            {
                "membershipId": str(item["membership_id"]),
                "status": item["status"],
                "institution": {
                    "institutionId": str(item["institution_id"]),
                    "institutionCode": item["institution_code"],
                    "institutionName": item["institution_name"],
                    "status": item["institution_status"],
                },
                "roles": list(item["roles"]),
            }
            for item in memberships
        ],
    }


def _create_session(user_id: str, request: Request) -> tuple[str, str, dict]:
    settings = get_settings()
    raw = opaque_token()
    with transaction(user_id=user_id) as connection:
        connection.execute(
            text("""
            INSERT INTO refresh_sessions(session_id,user_id,token_hash,expires_at,user_agent,ip_address,created_at)
            VALUES (:id,:user_id,:hash,:expires,:agent,CAST(:ip AS inet),now())
        """),
            {
                "id": str(uuid4()),
                "user_id": user_id,
                "hash": sha256(raw),
                "expires": datetime.now(UTC) + timedelta(days=settings.refresh_token_ttl_days),
                "agent": (request.headers.get("user-agent") or "")[:500] or None,
                "ip": client_ip(request),
            },
        )
    return create_access_token(user_id), raw, user_view(user_id)


@router.post(
    "/register",
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(rate_limiter.limit(5, 3600))],
)
def register(payload: RegisterInput) -> dict:
    settings = get_settings()
    code = verification_code()
    now = datetime.now(UTC)
    should_send = False
    with transaction() as connection:
        existing = row(
            connection,
            "SELECT user_id,email_verified_at,status FROM users WHERE email=:email",
            {"email": payload.email},
        )
        if not existing:
            user_id = str(uuid4())
            connection.execute(
                text("""
                INSERT INTO users(user_id,email,password_hash,status,created_at,updated_at)
                VALUES (:id,:email,:password,'ACTIVE',now(),now())
            """),
                {
                    "id": user_id,
                    "email": payload.email,
                    "password": hash_password(payload.password),
                },
            )
            connection.execute(
                text("""
                INSERT INTO user_profiles(user_id,first_name,middle_name,last_name,created_at,updated_at)
                VALUES (:id,:first,:middle,:last,now(),now())
            """),
                {
                    "id": user_id,
                    "first": payload.first_name,
                    "middle": payload.middle_name,
                    "last": payload.last_name,
                },
            )
        else:
            user_id = str(existing["user_id"])
            if existing["email_verified_at"] or existing["status"] == "DELETED":
                return {"message": GENERIC_REGISTRATION}
            connection.execute(
                text(
                    "UPDATE users SET password_hash=:password,status='ACTIVE',updated_at=now() WHERE user_id=:id"
                ),
                {"password": hash_password(payload.password), "id": user_id},
            )
            connection.execute(
                text("""
                INSERT INTO user_profiles(user_id,first_name,middle_name,last_name,created_at,updated_at)
                VALUES (:id,:first,:middle,:last,now(),now())
                ON CONFLICT(user_id) DO UPDATE SET first_name=excluded.first_name,
                  middle_name=excluded.middle_name,last_name=excluded.last_name,updated_at=now()
            """),
                {
                    "id": user_id,
                    "first": payload.first_name,
                    "middle": payload.middle_name,
                    "last": payload.last_name,
                },
            )
        connection.execute(
            text("""
            UPDATE verification_challenges SET consumed_at=:now
            WHERE email=:email AND purpose='EMAIL_VERIFICATION' AND consumed_at IS NULL
        """),
            {"now": now, "email": payload.email},
        )
        connection.execute(
            text("""
            INSERT INTO verification_challenges(challenge_id,user_id,email,purpose,token_hash,expires_at,created_at)
            VALUES (:id,:user_id,:email,'EMAIL_VERIFICATION',:hash,:expires,now())
        """),
            {
                "id": str(uuid4()),
                "user_id": user_id,
                "email": payload.email,
                "hash": verification_digest(payload.email, code),
                "expires": now + timedelta(minutes=settings.email_verification_ttl_minutes),
            },
        )
        should_send = True
    if should_send:
        send_verification(payload.email, code)
    return {"message": GENERIC_REGISTRATION}


@router.post("/verify-email", dependencies=[Depends(rate_limiter.limit(10, 900))])
def verify_email(payload: VerifyEmailInput) -> dict:
    now = datetime.now(UTC)
    error: ApplicationError | None = None
    with transaction() as connection:
        challenge = row(
            connection,
            """
            SELECT challenge_id,user_id,token_hash,attempts,expires_at FROM verification_challenges
            WHERE email=:email AND purpose='EMAIL_VERIFICATION' AND consumed_at IS NULL
            ORDER BY created_at DESC LIMIT 1 FOR UPDATE
        """,
            {"email": payload.email},
        )
        if not challenge or not challenge["user_id"] or challenge["expires_at"] <= now:
            if challenge:
                connection.execute(
                    text(
                        "UPDATE verification_challenges SET consumed_at=:now WHERE challenge_id=:id"
                    ),
                    {"now": now, "id": challenge["challenge_id"]},
                )
            error = ApplicationError(400, "INVALID_VERIFICATION_CODE", "Invalid or expired code")
        elif challenge["attempts"] >= 5:
            error = ApplicationError(429, "VERIFICATION_ATTEMPTS_EXCEEDED", "Request a new code")
        elif challenge["token_hash"] != verification_digest(payload.email, payload.code):
            connection.execute(
                text(
                    "UPDATE verification_challenges SET attempts=attempts+1 WHERE challenge_id=:id"
                ),
                {"id": challenge["challenge_id"]},
            )
            error = ApplicationError(400, "INVALID_VERIFICATION_CODE", "Invalid or expired code")
        else:
            connection.execute(
                text("UPDATE verification_challenges SET consumed_at=:now WHERE challenge_id=:id"),
                {"now": now, "id": challenge["challenge_id"]},
            )
            connection.execute(
                text("UPDATE users SET email_verified_at=:now,updated_at=:now WHERE user_id=:id"),
                {"now": now, "id": challenge["user_id"]},
            )
    if error:
        raise error
    return {"message": "Email verified"}


@router.post(
    "/resend-verification", status_code=202, dependencies=[Depends(rate_limiter.limit(5, 900))]
)
def resend_verification(payload: EmailInput) -> dict:
    settings = get_settings()
    now = datetime.now(UTC)
    code = verification_code()
    send = False
    with transaction() as connection:
        user = row(
            connection,
            "SELECT user_id,email_verified_at,status FROM users WHERE email=:email",
            {"email": payload.email},
        )
        if user and not user["email_verified_at"] and user["status"] == "ACTIVE":
            connection.execute(
                text(
                    "UPDATE verification_challenges SET consumed_at=:now WHERE email=:email AND purpose='EMAIL_VERIFICATION' AND consumed_at IS NULL"
                ),
                {"now": now, "email": payload.email},
            )
            connection.execute(
                text("""INSERT INTO verification_challenges(challenge_id,user_id,email,purpose,token_hash,expires_at,created_at)
                VALUES(:id,:user_id,:email,'EMAIL_VERIFICATION',:hash,:expires,now())"""),
                {
                    "id": str(uuid4()),
                    "user_id": user["user_id"],
                    "email": payload.email,
                    "hash": verification_digest(payload.email, code),
                    "expires": now + timedelta(minutes=settings.email_verification_ttl_minutes),
                },
            )
            send = True
    if send:
        send_verification(payload.email, code)
    return {"message": GENERIC_REGISTRATION}


@router.post("/login", dependencies=[Depends(rate_limiter.limit(10, 60))])
def login(payload: LoginInput, request: Request, response: Response) -> dict:
    failure: ApplicationError | None = None
    with transaction() as connection:
        user = row(
            connection,
            "SELECT user_id,password_hash,status,email_verified_at FROM users WHERE email=:email",
            {"email": payload.email},
        )
        if (
            not user
            or not verify_password(user["password_hash"], payload.password)
            or user["status"] != "ACTIVE"
        ):
            if user:
                write_audit(
                    connection,
                    actor_user_id=str(user["user_id"]),
                    action="login.failed",
                    entity_type="user",
                    entity_id=str(user["user_id"]),
                    metadata={"reason": "invalid_credentials_or_status"},
                    ip_address=client_ip(request),
                    user_agent=request.headers.get("user-agent"),
                )
            failure = ApplicationError(401, "INVALID_CREDENTIALS", "Email or password is incorrect")
        elif not user["email_verified_at"]:
            failure = ApplicationError(
                403, "EMAIL_NOT_VERIFIED", "Verify your email before signing in"
            )
        else:
            user_id = str(user["user_id"])
            if user["password_hash"] and not user["password_hash"].startswith("$argon2id$"):
                connection.execute(
                    text(
                        "UPDATE users SET password_hash=:value,updated_at=now() WHERE user_id=:id"
                    ),
                    {"value": hash_password(payload.password), "id": user_id},
                )
    if failure:
        raise failure
    access, refresh, view = _create_session(user_id, request)
    _set_refresh_cookie(response, refresh)
    return {"accessToken": access, "user": view}


@router.post("/google", dependencies=[Depends(rate_limiter.limit(10, 60))])
def google_login(payload: GoogleLoginInput, request: Request, response: Response) -> dict:
    identity = verify_google_credential(payload.credential)
    with transaction() as connection:
        linked = row(
            connection,
            """SELECT e.user_id,u.status FROM external_identities e JOIN users u USING(user_id)
            WHERE e.provider='google' AND e.provider_subject=:subject""",
            {"subject": identity["subject"]},
        )
        if linked:
            if linked["status"] != "ACTIVE":
                raise ApplicationError(401, "INVALID_CREDENTIALS", "Account is unavailable")
            user_id = str(linked["user_id"])
        else:
            user = row(
                connection,
                "SELECT user_id,status,email_verified_at FROM users WHERE email=:email",
                {"email": identity["email"]},
            )
            if user and user["status"] != "ACTIVE":
                raise ApplicationError(401, "INVALID_CREDENTIALS", "Account is unavailable")
            if not user:
                user_id = str(uuid4())
                connection.execute(
                    text(
                        "INSERT INTO users(user_id,email,password_hash,status,email_verified_at,created_at,updated_at) VALUES(:id,:email,NULL,'ACTIVE',now(),now(),now())"
                    ),
                    {"id": user_id, "email": identity["email"]},
                )
                connection.execute(
                    text(
                        "INSERT INTO user_profiles(user_id,first_name,last_name,created_at,updated_at) VALUES(:id,:first,:last,now(),now())"
                    ),
                    {"id": user_id, "first": identity["first_name"], "last": identity["last_name"]},
                )
            else:
                user_id = str(user["user_id"])
                if not user["email_verified_at"]:
                    connection.execute(
                        text(
                            "UPDATE users SET email_verified_at=now(),updated_at=now() WHERE user_id=:id"
                        ),
                        {"id": user_id},
                    )
            connection.execute(
                text(
                    "INSERT INTO external_identities(provider,provider_subject,user_id,email) VALUES('google',:subject,:user_id,:email)"
                ),
                {"subject": identity["subject"], "user_id": user_id, "email": identity["email"]},
            )
    access, refresh, view = _create_session(user_id, request)
    _set_refresh_cookie(response, refresh)
    return {"accessToken": access, "user": view}


@router.post(
    "/refresh", dependencies=[Depends(_trusted_origin), Depends(rate_limiter.limit(30, 60))]
)
def refresh(request: Request, response: Response) -> dict:
    raw = request.cookies.get(COOKIE_NAME)
    if not raw:
        raise ApplicationError(401, "INVALID_SESSION", "Sign in required")
    settings = get_settings()
    now = datetime.now(UTC)
    next_raw = opaque_token()
    invalid = False
    with transaction() as connection:
        session = row(
            connection,
            "SELECT session_id,user_id,expires_at,revoked_at FROM refresh_sessions WHERE token_hash=:hash FOR UPDATE",
            {"hash": sha256(raw)},
        )
        if not session or session["expires_at"] <= now or session["revoked_at"]:
            if session and session["revoked_at"]:
                connection.execute(
                    text(
                        "UPDATE refresh_sessions SET revoked_at=now() WHERE user_id=:id AND revoked_at IS NULL"
                    ),
                    {"id": session["user_id"]},
                )
            invalid = True
        else:
            user = row(
                connection,
                "SELECT status,email_verified_at FROM users WHERE user_id=:id",
                {"id": session["user_id"]},
            )
            if not user or user["status"] != "ACTIVE" or not user["email_verified_at"]:
                connection.execute(
                    text(
                        "UPDATE refresh_sessions SET revoked_at=now() WHERE user_id=:id AND revoked_at IS NULL"
                    ),
                    {"id": session["user_id"]},
                )
                invalid = True
            else:
                next_id = str(uuid4())
                connection.execute(
                    text(
                        "INSERT INTO refresh_sessions(session_id,user_id,token_hash,expires_at,user_agent,ip_address,created_at) VALUES(:id,:user,:hash,:expires,:agent,CAST(:ip AS inet),now())"
                    ),
                    {
                        "id": next_id,
                        "user": session["user_id"],
                        "hash": sha256(next_raw),
                        "expires": now + timedelta(days=settings.refresh_token_ttl_days),
                        "agent": (request.headers.get("user-agent") or "")[:500] or None,
                        "ip": client_ip(request),
                    },
                )
                connection.execute(
                    text(
                        "UPDATE refresh_sessions SET revoked_at=now(),replaced_by_session_id=:next WHERE session_id=:id"
                    ),
                    {"next": next_id, "id": session["session_id"]},
                )
                user_id = str(session["user_id"])
    if invalid:
        raise ApplicationError(401, "INVALID_SESSION", "Sign in required")
    _set_refresh_cookie(response, next_raw)
    return {"accessToken": create_access_token(user_id), "user": user_view(user_id)}


@router.post("/logout", status_code=204, dependencies=[Depends(_trusted_origin)])
def logout(request: Request, response: Response) -> Response:
    raw = request.cookies.get(COOKIE_NAME)
    if raw:
        with transaction() as connection:
            connection.execute(
                text(
                    "UPDATE refresh_sessions SET revoked_at=now() WHERE token_hash=:hash AND revoked_at IS NULL"
                ),
                {"hash": sha256(raw)},
            )
    response.delete_cookie(
        COOKIE_NAME,
        path=COOKIE_PATH,
        secure=get_settings().cookie_secure,
        httponly=True,
        samesite="lax",
    )
    response.status_code = 204
    return response


@router.post("/forgot-password", dependencies=[Depends(rate_limiter.limit(5, 3600))])
def forgot_password(payload: EmailInput) -> dict:
    raw = opaque_token()
    now = datetime.now(UTC)
    send = False
    with transaction() as connection:
        user = row(
            connection,
            "SELECT user_id,email,status,email_verified_at FROM users WHERE email=:email",
            {"email": payload.email},
        )
        if user and user["status"] == "ACTIVE" and user["email_verified_at"]:
            connection.execute(
                text(
                    "UPDATE verification_challenges SET consumed_at=:now WHERE user_id=:id AND purpose='PASSWORD_RESET' AND consumed_at IS NULL"
                ),
                {"now": now, "id": user["user_id"]},
            )
            connection.execute(
                text(
                    "INSERT INTO verification_challenges(challenge_id,user_id,email,purpose,token_hash,expires_at,created_at) VALUES(:cid,:uid,:email,'PASSWORD_RESET',:hash,:expires,now())"
                ),
                {
                    "cid": str(uuid4()),
                    "uid": user["user_id"],
                    "email": user["email"],
                    "hash": sha256(raw),
                    "expires": now + timedelta(minutes=get_settings().password_reset_ttl_minutes),
                },
            )
            send = True
    if send:
        send_password_reset(payload.email, raw)
    return {"message": GENERIC_RESET}


@router.post("/reset-password", dependencies=[Depends(rate_limiter.limit(5, 900))])
def reset_password(payload: ResetPasswordInput) -> dict:
    now = datetime.now(UTC)
    with transaction() as connection:
        challenge = row(
            connection,
            "SELECT challenge_id,user_id,expires_at,consumed_at FROM verification_challenges WHERE token_hash=:hash AND purpose='PASSWORD_RESET' FOR UPDATE",
            {"hash": sha256(payload.token)},
        )
        if (
            not challenge
            or not challenge["user_id"]
            or challenge["consumed_at"]
            or challenge["expires_at"] <= now
        ):
            raise ApplicationError(400, "INVALID_RESET_TOKEN", "Invalid or expired reset token")
        connection.execute(
            text("UPDATE users SET password_hash=:password,updated_at=:now WHERE user_id=:id"),
            {"password": hash_password(payload.password), "now": now, "id": challenge["user_id"]},
        )
        connection.execute(
            text("UPDATE verification_challenges SET consumed_at=:now WHERE challenge_id=:id"),
            {"now": now, "id": challenge["challenge_id"]},
        )
        connection.execute(
            text(
                "UPDATE refresh_sessions SET revoked_at=:now WHERE user_id=:id AND revoked_at IS NULL"
            ),
            {"now": now, "id": challenge["user_id"]},
        )
    return {"message": "Password reset complete"}


@router.get("/me")
def me(actor: UserActor = Depends(authenticated_actor)) -> dict:
    return {"user": user_view(actor.user_id)}
