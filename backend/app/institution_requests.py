from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy import text

from .audit import write_audit
from .database import row, rows, transaction
from .dependencies import UserActor, authenticated_actor, rate_limiter
from .errors import ApplicationError
from .schemas import InstitutionRequestInput, RejectRequestInput

router = APIRouter(tags=["institution registration"])
REQUEST_COLUMNS = """
 request_id AS "requestId", institution_name AS "institutionName",
 institution_type AS "institutionType", board_id AS "boardId",
 registration_number AS "registrationNumber", official_email AS "officialEmail",
 official_phone AS "officialPhone", address_line_1 AS "addressLine1",
 address_line_2 AS "addressLine2", city, state, postal_code AS "postalCode",
 country, proof_file_id AS "proofFileId", status, reviewed_at AS "reviewedAt",
 rejection_reason AS "rejectionReason", approved_institution_id AS "approvedInstitutionId",
 created_at AS "createdAt", updated_at AS "updatedAt"
"""


def _platform_actor(actor: UserActor = Depends(authenticated_actor)) -> UserActor:
    with transaction(user_id=actor.user_id, platform=True) as connection:
        allowed = row(
            connection,
            """SELECT 1 FROM platform_user_roles WHERE user_id=:id
            AND role IN ('PLATFORM_SUPER_ADMIN','PLATFORM_INSTITUTION_REVIEWER') LIMIT 1""",
            {"id": actor.user_id},
        )
    if not allowed:
        raise ApplicationError(403, "PLATFORM_PERMISSION_DENIED", "Permission denied")
    return actor


def _page(items: list[dict], limit: int) -> dict:
    more = len(items) > limit
    result = items[:limit]
    return {"items": result, "nextCursor": str(result[-1]["requestId"]) if more else None}


@router.post(
    "/api/v1/institution-requests",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limiter.limit(5, 3600))],
)
def create_request(
    payload: InstitutionRequestInput,
    request: Request,
    actor: UserActor = Depends(authenticated_actor),
) -> dict:
    data = payload.model_dump()
    with transaction(user_id=actor.user_id) as connection:
        if payload.board_id and not row(
            connection, "SELECT 1 FROM boards WHERE board_id=:id", {"id": payload.board_id}
        ):
            raise ApplicationError(422, "INVALID_BOARD", "Request validation failed")
        if row(
            connection,
            "SELECT request_id FROM institution_registration_requests WHERE submitted_by_user_id=:id AND status IN ('PENDING','UNDER_REVIEW') LIMIT 1",
            {"id": actor.user_id},
        ):
            raise ApplicationError(
                409,
                "ACTIVE_REGISTRATION_REQUEST_EXISTS",
                "You already have a school registration request awaiting review",
            )
        request_id = str(uuid4())
        created = row(
            connection,
            f"""INSERT INTO institution_registration_requests
            (request_id,submitted_by_user_id,institution_name,institution_type,board_id,registration_number,
             official_email,official_phone,address_line_1,address_line_2,city,state,postal_code,country,
             proof_file_id,status,created_at,updated_at)
            VALUES (:request_id,:user_id,:institution_name,CAST(:institution_type AS \"InstitutionType\"),:board_id,
             :registration_number,:official_email,:official_phone,:address_line1,:address_line2,:city,:state,
             :postal_code,:country,:proof_file_id,'PENDING',now(),now()) RETURNING {REQUEST_COLUMNS}""",
            {**data, "request_id": request_id, "user_id": actor.user_id},
        )
        write_audit(
            connection,
            actor_user_id=actor.user_id,
            action="institution.request.created",
            entity_type="institution_registration_request",
            entity_id=request_id,
            ip_address=actor.ip_address,
            user_agent=actor.user_agent,
        )
    return created or {}


@router.get("/api/v1/boards")
def list_boards(_: UserActor = Depends(authenticated_actor)) -> dict:
    with transaction() as connection:
        items = rows(
            connection,
            'SELECT board_id AS "boardId",board_code AS "boardCode",display_name AS "displayName" FROM boards ORDER BY display_name,board_code',
        )
    return {"items": items}


def _list_requests(
    *,
    user_id: str | None,
    limit: int,
    cursor: UUID | None,
    state: str | None,
    direction: str,
    platform: bool = False,
) -> dict:
    operator = "<" if direction == "desc" else ">"
    order = "DESC" if direction == "desc" else "ASC"
    clauses = []
    params = {"limit": limit + 1}
    if user_id:
        clauses.append("submitted_by_user_id=:user_id")
        params["user_id"] = user_id
    if state:
        clauses.append('status=CAST(:state AS "RegistrationRequestStatus")')
        params["state"] = state
    if cursor:
        clauses.append(
            f"(created_at,request_id) {operator} (SELECT created_at,request_id FROM institution_registration_requests WHERE request_id=:cursor)"
        )
        params["cursor"] = cursor
    where = "WHERE " + " AND ".join(clauses) if clauses else ""
    extra = (
        ', submitted_by_user_id AS "submittedByUserId", reviewed_by_user_id AS "reviewedByUserId"'
        if platform
        else ""
    )
    with transaction(user_id=user_id, platform=platform) as connection:
        items = rows(
            connection,
            f"SELECT {REQUEST_COLUMNS}{extra} FROM institution_registration_requests {where} ORDER BY created_at {order},request_id {order} LIMIT :limit",
            params,
        )
        if platform:
            for item in items:
                submitter = row(
                    connection,
                    'SELECT u.email,p.first_name AS "firstName",p.middle_name AS "middleName",p.last_name AS "lastName" FROM users u LEFT JOIN user_profiles p USING(user_id) WHERE u.user_id=:id',
                    {"id": item["submittedByUserId"]},
                )
                item["submittedByUser"] = (
                    {
                        "email": submitter["email"],
                        "profile": {
                            k: submitter[k] for k in ("firstName", "middleName", "lastName")
                        },
                    }
                    if submitter
                    else None
                )
    return _page(items, limit)


@router.get("/api/v1/institution-requests/me")
def list_mine(
    limit: int = Query(25, ge=1, le=100),
    cursor: UUID | None = None,
    status_filter: str | None = Query(
        None, alias="status", pattern="^(PENDING|UNDER_REVIEW|APPROVED|REJECTED|CANCELLED)$"
    ),
    sort: Literal["createdAt"] = "createdAt",
    direction: Literal["asc", "desc"] = "desc",
    actor: UserActor = Depends(authenticated_actor),
) -> dict:
    return _list_requests(
        user_id=actor.user_id, limit=limit, cursor=cursor, state=status_filter, direction=direction
    )


@router.get("/api/v1/institution-requests/{request_id}")
def get_mine(request_id: UUID, actor: UserActor = Depends(authenticated_actor)) -> dict:
    with transaction(user_id=actor.user_id) as connection:
        item = row(
            connection,
            f"SELECT {REQUEST_COLUMNS} FROM institution_registration_requests WHERE request_id=:rid AND submitted_by_user_id=:uid",
            {"rid": request_id, "uid": actor.user_id},
        )
    if not item:
        raise ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found")
    return item


@router.get("/api/v1/platform/institution-requests")
def list_platform(
    limit: int = Query(25, ge=1, le=100),
    cursor: UUID | None = None,
    status_filter: str | None = Query(
        None, alias="status", pattern="^(PENDING|UNDER_REVIEW|APPROVED|REJECTED|CANCELLED)$"
    ),
    sort: Literal["createdAt"] = "createdAt",
    direction: Literal["asc", "desc"] = "desc",
    actor: UserActor = Depends(_platform_actor),
) -> dict:
    return _list_requests(
        user_id=None,
        limit=limit,
        cursor=cursor,
        state=status_filter,
        direction=direction,
        platform=True,
    )


@router.get("/api/v1/platform/institution-requests/{request_id}")
def get_platform(request_id: UUID, actor: UserActor = Depends(_platform_actor)) -> dict:
    with transaction(user_id=actor.user_id, platform=True) as connection:
        item = row(
            connection,
            f'SELECT {REQUEST_COLUMNS},submitted_by_user_id AS "submittedByUserId",reviewed_by_user_id AS "reviewedByUserId" FROM institution_registration_requests WHERE request_id=:id',
            {"id": request_id},
        )
        if item:
            submitter = row(
                connection,
                'SELECT u.email,u.phone,p.first_name AS "firstName",p.middle_name AS "middleName",p.last_name AS "lastName",p.date_of_birth AS "dateOfBirth",p.gender,p.profile_photo_file_id AS "profilePhotoFileId" FROM users u LEFT JOIN user_profiles p USING(user_id) WHERE u.user_id=:id',
                {"id": item["submittedByUserId"]},
            )
            item["submittedByUser"] = (
                {
                    "email": submitter.pop("email"),
                    "phone": submitter.pop("phone"),
                    "profile": submitter,
                }
                if submitter
                else None
            )
    if not item:
        raise ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found")
    return item


def _review_action(
    request_id: UUID, actor: UserActor, action: str, rejection_reason: str | None = None
) -> dict:
    isolation = "SERIALIZABLE" if action == "approve" else "READ COMMITTED"
    with transaction(user_id=actor.user_id, platform=True, isolation_level=isolation) as connection:
        current = row(
            connection,
            "SELECT * FROM institution_registration_requests WHERE request_id=:id FOR UPDATE",
            {"id": request_id},
        )
        if not current:
            raise ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found")
        if action == "start":
            if current["status"] != "PENDING":
                raise ApplicationError(409, "REQUEST_STATE_CONFLICT", "Request cannot enter review")
            result = row(
                connection,
                f"UPDATE institution_registration_requests SET status='UNDER_REVIEW',reviewed_by_user_id=:user,rejection_reason=NULL,updated_at=now() WHERE request_id=:id RETURNING {REQUEST_COLUMNS}",
                {"user": actor.user_id, "id": request_id},
            )
            audit = "review_started"
        elif action == "reject":
            if current["status"] != "UNDER_REVIEW":
                raise ApplicationError(409, "REQUEST_STATE_CONFLICT", "Request cannot be rejected")
            result = row(
                connection,
                f"UPDATE institution_registration_requests SET status='REJECTED',reviewed_by_user_id=:user,reviewed_at=now(),rejection_reason=:reason,updated_at=now() WHERE request_id=:id RETURNING {REQUEST_COLUMNS}",
                {"user": actor.user_id, "reason": rejection_reason, "id": request_id},
            )
            audit = "rejected"
        else:
            if current["status"] != "UNDER_REVIEW" or current["approved_institution_id"]:
                raise ApplicationError(409, "REQUEST_STATE_CONFLICT", "Request cannot be approved")
            role = row(connection, "SELECT role_id FROM roles WHERE role_code='ROOT_ADMIN'")
            if not role:
                raise ApplicationError(
                    500,
                    "AUTHORIZATION_CATALOG_MISSING",
                    "Authorization catalog is not seeded",
                    False,
                )
            institution_id = str(uuid4())
            membership_id = str(uuid4())
            reviewed_at = datetime.now(UTC)
            code = f"ESQ-{str(current['institution_type'])[:3]}-{str(request_id).replace('-', '')[:10]}".upper()
            connection.execute(
                text(
                    "INSERT INTO institutions(institution_id,institution_code,institution_name,institution_type,board_id,status,created_at,updated_at) VALUES(:iid,:code,:name,CAST(:type AS \"InstitutionType\"),:board,'ACTIVE',now(),now())"
                ),
                {
                    "iid": institution_id,
                    "code": code,
                    "name": current["institution_name"],
                    "type": current["institution_type"],
                    "board": current["board_id"],
                },
            )
            connection.execute(
                text(
                    "INSERT INTO institution_memberships(membership_id,institution_id,user_id,status,joined_at,created_at,updated_at) VALUES(:mid,:iid,:uid,'ACTIVE',now(),now(),now())"
                ),
                {
                    "mid": membership_id,
                    "iid": institution_id,
                    "uid": current["submitted_by_user_id"],
                },
            )
            connection.execute(
                text(
                    "INSERT INTO membership_roles(membership_id,role_id,assigned_at) VALUES(:mid,:rid,now())"
                ),
                {"mid": membership_id, "rid": role["role_id"]},
            )
            connection.execute(
                text(
                    "UPDATE institution_registration_requests SET status='APPROVED',reviewed_by_user_id=:user,reviewed_at=:at,rejection_reason=NULL,approved_institution_id=:iid,updated_at=now() WHERE request_id=:id"
                ),
                {"user": actor.user_id, "at": reviewed_at, "iid": institution_id, "id": request_id},
            )
            write_audit(
                connection,
                actor_user_id=actor.user_id,
                institution_id=institution_id,
                action="institution.request.approved",
                entity_type="institution_registration_request",
                entity_id=str(request_id),
                metadata={"institutionId": institution_id, "membershipId": membership_id},
                ip_address=actor.ip_address,
                user_agent=actor.user_agent,
            )
            return {
                "requestId": request_id,
                "status": "APPROVED",
                "reviewedAt": reviewed_at,
                "institution": {
                    "institutionId": institution_id,
                    "institutionCode": code,
                    "institutionName": current["institution_name"],
                },
                "rootMembershipId": membership_id,
            }
        write_audit(
            connection,
            actor_user_id=actor.user_id,
            action=f"institution.request.{audit}",
            entity_type="institution_registration_request",
            entity_id=str(request_id),
            metadata={"rejectionReason": rejection_reason} if rejection_reason else {},
            ip_address=actor.ip_address,
            user_agent=actor.user_agent,
        )
        return result or {}


@router.post("/api/v1/platform/institution-requests/{request_id}/start-review")
def start_review(request_id: UUID, actor: UserActor = Depends(_platform_actor)) -> dict:
    return _review_action(request_id, actor, "start")


@router.post("/api/v1/platform/institution-requests/{request_id}/approve")
def approve(request_id: UUID, actor: UserActor = Depends(_platform_actor)) -> dict:
    return _review_action(request_id, actor, "approve")


@router.post("/api/v1/platform/institution-requests/{request_id}/reject")
def reject(
    request_id: UUID, payload: RejectRequestInput, actor: UserActor = Depends(_platform_actor)
) -> dict:
    return _review_action(request_id, actor, "reject", payload.rejection_reason)
