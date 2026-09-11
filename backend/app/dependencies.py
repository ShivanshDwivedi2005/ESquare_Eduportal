from __future__ import annotations

import time
from ipaddress import ip_address
from collections import defaultdict, deque
from dataclasses import dataclass
from threading import Lock
from typing import Annotated, Callable
from uuid import UUID

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .audit import write_audit
from .database import row, rows, transaction
from .errors import ApplicationError
from .security import verify_access_token

bearer = HTTPBearer(auto_error=False)


def client_ip(request: Request) -> str | None:
    value = request.client.host if request.client else None
    try:
        return str(ip_address(value)) if value else None
    except ValueError:
        return None


@dataclass
class UserActor:
    user_id: str
    ip_address: str | None
    user_agent: str | None


@dataclass
class InstitutionActor(UserActor):
    institution_id: str
    membership_id: str
    role_codes: list[str]
    permission_codes: list[str]


def authenticated_actor(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> UserActor:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise ApplicationError(401, "AUTHENTICATION_REQUIRED", "Sign in required")
    subject = verify_access_token(credentials.credentials)
    try:
        UUID(subject or "")
    except ValueError as error:
        raise ApplicationError(401, "INVALID_ACCESS_TOKEN", "Sign in required") from error
    with transaction(user_id=subject) as connection:
        user = row(
            connection,
            "SELECT user_id FROM users WHERE user_id=:id AND status='ACTIVE' AND email_verified_at IS NOT NULL",
            {"id": subject},
        )
    if not user:
        raise ApplicationError(401, "INVALID_ACCESS_TOKEN", "Sign in required")
    return UserActor(subject, client_ip(request), request.headers.get("user-agent"))


def institution_actor(required_any: tuple[str, ...] = ()) -> Callable:
    def dependency(
        request: Request, actor: Annotated[UserActor, Depends(authenticated_actor)]
    ) -> InstitutionActor:
        institution_id = request.path_params.get("institution_id")
        try:
            UUID(institution_id or "")
        except ValueError as error:
            raise ApplicationError(422, "VALIDATION_ERROR", "Request validation failed") from error
        with transaction(user_id=actor.user_id, institution_id=institution_id) as connection:
            membership = row(
                connection,
                """
                SELECT m.membership_id, m.institution_id
                FROM institution_memberships m JOIN institutions i USING (institution_id)
                WHERE m.user_id=:user_id AND m.institution_id=:institution_id
                  AND m.status='ACTIVE' AND i.status='ACTIVE'
            """,
                {"user_id": actor.user_id, "institution_id": institution_id},
            )
            if not membership:
                raise ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found")
            grants = rows(
                connection,
                """
                SELECT DISTINCT r.role_code, p.permission_code
                FROM membership_roles mr JOIN roles r USING(role_id)
                LEFT JOIN role_permissions rp USING(role_id)
                LEFT JOIN permissions p USING(permission_id)
                WHERE mr.membership_id=:membership_id
            """,
                {"membership_id": membership["membership_id"]},
            )
        roles = sorted({item["role_code"] for item in grants})
        permissions = sorted(
            {item["permission_code"] for item in grants if item["permission_code"]}
        )
        if required_any and not any(permission in permissions for permission in required_any):
            with transaction(user_id=actor.user_id, institution_id=institution_id) as connection:
                write_audit(
                    connection,
                    actor_user_id=actor.user_id,
                    actor_membership_id=str(membership["membership_id"]),
                    institution_id=institution_id,
                    action="permission.denied",
                    entity_type="institution",
                    entity_id=institution_id,
                    metadata={"permissions": list(required_any)},
                    ip_address=actor.ip_address,
                    user_agent=actor.user_agent,
                )
            raise ApplicationError(403, "PERMISSION_DENIED", "Permission denied")
        return InstitutionActor(
            actor.user_id,
            actor.ip_address,
            actor.user_agent,
            institution_id,
            str(membership["membership_id"]),
            roles,
            permissions,
        )

    return dependency


class RateLimiter:
    def __init__(self) -> None:
        self._events: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def limit(self, maximum: int, window_seconds: int) -> Callable:
        def dependency(request: Request) -> None:
            self.check(request, maximum, window_seconds)

        return dependency

    def check(
        self, request: Request, maximum: int, window_seconds: int, scope: str | None = None
    ) -> None:
        key = f"{request.client.host if request.client else 'unknown'}:{request.url.path}"
        if scope:
            key = f"{request.client.host if request.client else 'unknown'}:{scope}"
        now = time.monotonic()
        with self._lock:
            events = self._events[key]
            while events and events[0] <= now - window_seconds:
                events.popleft()
            if len(events) >= maximum:
                raise ApplicationError(429, "RATE_LIMIT_EXCEEDED", "Too many requests")
            events.append(now)


rate_limiter = RateLimiter()
