from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import text

from .audit import write_audit
from .config import get_settings
from .database import row, rows, transaction
from .dependencies import (
    InstitutionActor,
    UserActor,
    authenticated_actor,
    institution_actor,
    rate_limiter,
)
from .errors import ApplicationError
from .mail import send_invitation
from .schemas import AdminInvitationInput, InvitationTokenInput
from .security import opaque_token, sha256

router = APIRouter(tags=["invitations"])
SAFE_COLUMNS = 'i.invitation_id AS "invitationId",i.institution_id AS "institutionId",i.invitation_type AS "invitationType",i.email,i.phone,i.onboarding_record_id AS "onboardingRecordId",i.status,i.expires_at AS "expiresAt",i.claimed_at AS "claimedAt",i.claimed_by_user_id AS "claimedByUserId",i.created_by_membership_id AS "createdByMembershipId",i.created_at AS "createdAt",i.updated_at AS "updatedAt",r.role_code AS "roleCode",r.display_name AS "roleName"'


def _expiry() -> datetime:
    return datetime.now(UTC) + timedelta(hours=get_settings().invitation_ttl_hours)


def _safe(item: dict) -> dict:
    role = (
        {"roleCode": item.pop("roleCode"), "displayName": item.pop("roleName")}
        if item.get("roleCode")
        else None
    )
    item["targetRole"] = role
    return item


def create_onboarding_invitation(
    connection,
    institution_id: str,
    onboarding_id: str,
    email: str,
    kind: str,
    role_id,
    creator: str,
) -> dict:
    raw = opaque_token()
    invitation_id = str(uuid4())
    expires = _expiry()
    connection.execute(
        text("""INSERT INTO invitations(invitation_id,institution_id,invitation_type,email,target_role_id,onboarding_record_id,token_hash,status,expires_at,created_by_membership_id,created_at,updated_at)
        VALUES(:id,:iid,CAST(:kind AS \"InvitationType\"),:email,:role,:onboarding,:hash,'PENDING',:expires,:creator,now(),now())"""),
        {
            "id": invitation_id,
            "iid": institution_id,
            "kind": kind,
            "email": email,
            "role": role_id,
            "onboarding": onboarding_id,
            "hash": sha256(raw),
            "expires": expires,
            "creator": creator,
        },
    )
    return {"rawToken": raw, "invitationId": invitation_id, "expiresAt": expires}


@router.post(
    "/api/v1/institutions/{institution_id}/admin-invitations", status_code=status.HTTP_201_CREATED
)
def create_admin_invitation(
    institution_id: UUID,
    payload: AdminInvitationInput,
    actor: InstitutionActor = Depends(institution_actor(("ADMIN_CREATE",))),
) -> dict:
    if "ROOT_ADMIN" not in actor.role_codes:
        raise ApplicationError(403, "ROLE_ASSIGNMENT_DENIED", "Role cannot be assigned")
    raw = opaque_token()
    with transaction(user_id=actor.user_id, institution_id=actor.institution_id) as connection:
        role = row(
            connection,
            "SELECT role_id FROM roles WHERE role_code=:code",
            {"code": payload.target_role},
        )
        if not role:
            raise ApplicationError(
                500, "AUTHORIZATION_CATALOG_MISSING", "Configuration error", False
            )
        if row(
            connection,
            "SELECT 1 FROM invitations WHERE institution_id=:iid AND email=:email AND invitation_type='ADMIN' AND target_role_id=:rid AND status='PENDING' AND expires_at>now()",
            {"iid": institution_id, "email": payload.email, "rid": role["role_id"]},
        ):
            raise ApplicationError(
                409, "INVITATION_ALREADY_PENDING", "An invitation is already pending"
            )
        institution = row(
            connection,
            "SELECT institution_name FROM institutions WHERE institution_id=:id",
            {"id": institution_id},
        )
        if not institution:
            raise ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found")
        invitation_id = str(uuid4())
        row(
            connection,
            """INSERT INTO invitations(invitation_id,institution_id,invitation_type,email,target_role_id,token_hash,status,expires_at,created_by_membership_id,created_at,updated_at)
            VALUES(:id,:iid,'ADMIN',:email,:rid,:hash,'PENDING',:expires,:creator,now(),now()) RETURNING invitation_id""",
            {
                "id": invitation_id,
                "iid": institution_id,
                "email": payload.email,
                "rid": role["role_id"],
                "hash": sha256(raw),
                "expires": _expiry(),
                "creator": actor.membership_id,
            },
        )
        result = row(
            connection,
            f"SELECT {SAFE_COLUMNS} FROM invitations i LEFT JOIN roles r ON r.role_id=i.target_role_id WHERE i.invitation_id=:id",
            {"id": invitation_id},
        )
        write_audit(
            connection,
            actor_user_id=actor.user_id,
            actor_membership_id=actor.membership_id,
            institution_id=actor.institution_id,
            action="admin.invited",
            entity_type="invitation",
            entity_id=invitation_id,
            metadata={"targetRoleCode": payload.target_role},
            ip_address=actor.ip_address,
            user_agent=actor.user_agent,
        )
    send_invitation(payload.email, raw, institution["institution_name"], "ADMIN")
    return _safe(result or {})


@router.get("/api/v1/institutions/{institution_id}/invitations")
def list_invitations(
    institution_id: UUID,
    limit: int = Query(25, ge=1, le=100),
    cursor: UUID | None = None,
    status_filter: str | None = Query(
        None, alias="status", pattern="^(PENDING|CLAIMED|EXPIRED|REVOKED)$"
    ),
    type_filter: str | None = Query(None, alias="type", pattern="^(ADMIN|STUDENT|TEACHER|STAFF)$"),
    actor: InstitutionActor = Depends(institution_actor(("ADMIN_VIEW", "ADMISSION_INVITE_RESEND"))),
) -> dict:
    with transaction(user_id=actor.user_id, institution_id=actor.institution_id) as connection:
        connection.execute(
            text(
                "UPDATE invitations SET status='EXPIRED',updated_at=now() WHERE institution_id=:iid AND status='PENDING' AND expires_at<=now()"
            ),
            {"iid": institution_id},
        )
        clauses = ["i.institution_id=:iid"]
        params = {"iid": institution_id, "limit": limit + 1}
        if status_filter:
            clauses.append('i.status=CAST(:state AS "InvitationStatus")')
            params["state"] = status_filter
        if type_filter:
            clauses.append('i.invitation_type=CAST(:kind AS "InvitationType")')
            params["kind"] = type_filter
        if cursor:
            clauses.append(
                "(i.created_at,i.invitation_id)<(SELECT created_at,invitation_id FROM invitations WHERE invitation_id=:cursor)"
            )
            params["cursor"] = cursor
        items = [
            _safe(item)
            for item in rows(
                connection,
                f"SELECT {SAFE_COLUMNS} FROM invitations i LEFT JOIN roles r ON r.role_id=i.target_role_id WHERE {' AND '.join(clauses)} ORDER BY i.created_at DESC,i.invitation_id DESC LIMIT :limit",
                params,
            )
        ]
    more = len(items) > limit
    shown = items[:limit]
    return {"items": shown, "nextCursor": shown[-1]["invitationId"] if more else None}


def _change_invitation(invitation_id: UUID, actor: InstitutionActor, operation: str) -> dict:
    raw = opaque_token()
    with transaction(user_id=actor.user_id, institution_id=actor.institution_id) as connection:
        invitation = row(
            connection,
            "SELECT i.*,x.institution_name FROM invitations i JOIN institutions x USING(institution_id) WHERE i.invitation_id=:id AND i.institution_id=:iid FOR UPDATE",
            {"id": invitation_id, "iid": actor.institution_id},
        )
        if not invitation:
            raise ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found")
        allowed = (
            "ADMIN_CREATE"
            if invitation["invitation_type"] == "ADMIN"
            else ("ADMISSION_INVITE_RESEND" if operation == "resend" else "ADMISSION_INVITE_REVOKE")
        )
        if allowed not in actor.permission_codes:
            raise ApplicationError(403, "PERMISSION_DENIED", "Permission denied")
        if operation == "resend":
            if invitation["status"] not in ("PENDING", "EXPIRED") or not invitation["email"]:
                raise ApplicationError(
                    409, "INVITATION_STATE_CONFLICT", "Invitation cannot be resent"
                )
            connection.execute(
                text(
                    "UPDATE invitations SET token_hash=:hash,expires_at=:expires,status='PENDING',updated_at=now() WHERE invitation_id=:id"
                ),
                {"hash": sha256(raw), "expires": _expiry(), "id": invitation_id},
            )
        else:
            if invitation["status"] != "PENDING":
                raise ApplicationError(
                    409, "INVITATION_STATE_CONFLICT", "Invitation cannot be revoked"
                )
            connection.execute(
                text(
                    "UPDATE invitations SET status='REVOKED',updated_at=now() WHERE invitation_id=:id"
                ),
                {"id": invitation_id},
            )
        result = row(
            connection,
            f"SELECT {SAFE_COLUMNS} FROM invitations i LEFT JOIN roles r ON r.role_id=i.target_role_id WHERE i.invitation_id=:id",
            {"id": invitation_id},
        )
        prefix = (
            "admin"
            if invitation["invitation_type"] == "ADMIN"
            else invitation["invitation_type"].lower()
        )
        write_audit(
            connection,
            actor_user_id=actor.user_id,
            actor_membership_id=actor.membership_id,
            institution_id=actor.institution_id,
            action=f"{prefix}.invitation.{'resent' if operation == 'resend' else 'revoked'}",
            entity_type="invitation",
            entity_id=str(invitation_id),
            ip_address=actor.ip_address,
            user_agent=actor.user_agent,
        )
    if operation == "resend":
        send_invitation(
            invitation["email"], raw, invitation["institution_name"], invitation["invitation_type"]
        )
    return _safe(result or {})


@router.post("/api/v1/institutions/{institution_id}/invitations/{invitation_id}/resend")
def resend_invitation(
    institution_id: UUID,
    invitation_id: UUID,
    actor: InstitutionActor = Depends(
        institution_actor(("ADMIN_CREATE", "ADMISSION_INVITE_RESEND"))
    ),
) -> dict:
    return _change_invitation(invitation_id, actor, "resend")


@router.post("/api/v1/institutions/{institution_id}/invitations/{invitation_id}/revoke")
def revoke_invitation(
    institution_id: UUID,
    invitation_id: UUID,
    actor: InstitutionActor = Depends(
        institution_actor(("ADMIN_CREATE", "ADMISSION_INVITE_REVOKE"))
    ),
) -> dict:
    return _change_invitation(invitation_id, actor, "revoke")


@router.post("/api/v1/invitations/validate", dependencies=[Depends(rate_limiter.limit(30, 60))])
def validate_invitation(payload: InvitationTokenInput) -> dict:
    digest = sha256(payload.token)
    with transaction(invitation_hash=digest) as connection:
        item = row(
            connection,
            """SELECT i.invitation_type,i.email,i.status,i.expires_at,x.institution_name,x.institution_type,x.status AS institution_status,r.display_name
            FROM invitations i JOIN institutions x USING(institution_id) LEFT JOIN roles r ON r.role_id=i.target_role_id WHERE i.token_hash=:hash""",
            {"hash": digest},
        )
    if (
        not item
        or item["status"] != "PENDING"
        or item["expires_at"] <= datetime.now(UTC)
        or item["institution_status"] != "ACTIVE"
    ):
        raise ApplicationError(400, "INVALID_INVITATION", "Invalid or expired invitation")
    email = item["email"]
    masked = f"{email[:1]}***@{email.split('@', 1)[1]}" if email else None
    return {
        "invitationType": item["invitation_type"],
        "recipient": masked,
        "institution": {
            "institutionName": item["institution_name"],
            "institutionType": item["institution_type"],
        },
        "targetRole": item["display_name"],
        "expiresAt": item["expires_at"],
    }


@router.post("/api/v1/invitations/accept", dependencies=[Depends(rate_limiter.limit(10, 60))])
def accept_invitation(
    payload: InvitationTokenInput, actor: UserActor = Depends(authenticated_actor)
) -> dict:
    digest = sha256(payload.token)
    now = datetime.now(UTC)
    with transaction(
        user_id=actor.user_id, invitation_hash=digest, isolation_level="SERIALIZABLE"
    ) as connection:
        inv = row(
            connection,
            """SELECT i.*,x.status AS institution_status,r.role_code,o.person_type,o.status AS onboarding_status,
          sd.admission_number,ed.employee_number,ed.employee_type,ed.designation,ed.department
          FROM invitations i JOIN institutions x USING(institution_id) LEFT JOIN roles r ON r.role_id=i.target_role_id
          LEFT JOIN onboarding_records o ON o.onboarding_id=i.onboarding_record_id LEFT JOIN student_onboarding_details sd USING(onboarding_id)
          LEFT JOIN employee_onboarding_details ed USING(onboarding_id) WHERE i.token_hash=:hash FOR UPDATE OF i""",
            {"hash": digest},
        )
        if (
            not inv
            or inv["status"] != "PENDING"
            or inv["expires_at"] <= now
            or inv["institution_status"] != "ACTIVE"
            or not inv["email"]
            or not inv["target_role_id"]
        ):
            raise ApplicationError(400, "INVALID_INVITATION", "Invalid or expired invitation")
        connection.execute(
            text("SELECT set_config('app.current_institution_id',:id,true)"),
            {"id": str(inv["institution_id"])},
        )
        user = row(
            connection,
            "SELECT email,status,email_verified_at FROM users WHERE user_id=:id",
            {"id": actor.user_id},
        )
        if (
            not user
            or user["status"] != "ACTIVE"
            or not user["email_verified_at"]
            or user["email"].lower() != inv["email"].lower()
        ):
            raise ApplicationError(
                403, "INVITATION_RECIPIENT_MISMATCH", "Invitation recipient does not match"
            )
        membership = row(
            connection,
            "SELECT membership_id,status FROM institution_memberships WHERE institution_id=:iid AND user_id=:uid FOR UPDATE",
            {"iid": inv["institution_id"], "uid": actor.user_id},
        )
        if membership and membership["status"] in ("SUSPENDED", "LEFT"):
            raise ApplicationError(
                409, "MEMBERSHIP_STATE_CONFLICT", "Membership cannot accept invitation"
            )
        if not membership:
            mid = str(uuid4())
            connection.execute(
                text(
                    "INSERT INTO institution_memberships(membership_id,institution_id,user_id,status,joined_at,created_at,updated_at) VALUES(:mid,:iid,:uid,'ACTIVE',now(),now(),now())"
                ),
                {"mid": mid, "iid": inv["institution_id"], "uid": actor.user_id},
            )
        else:
            mid = str(membership["membership_id"])
            if membership["status"] == "PENDING":
                connection.execute(
                    text(
                        "UPDATE institution_memberships SET status='ACTIVE',updated_at=now() WHERE membership_id=:id"
                    ),
                    {"id": mid},
                )
        connection.execute(
            text(
                "INSERT INTO membership_roles(membership_id,role_id,assigned_by_membership_id,assigned_at) VALUES(:mid,:rid,:creator,now()) ON CONFLICT DO NOTHING"
            ),
            {"mid": mid, "rid": inv["target_role_id"], "creator": inv["created_by_membership_id"]},
        )
        entity = None
        kind = inv["invitation_type"]
        if kind != "ADMIN":
            if not inv["onboarding_record_id"] or inv["onboarding_status"] != "INVITED":
                raise ApplicationError(
                    409, "ONBOARDING_STATE_CONFLICT", "Invitation cannot be claimed"
                )
            if (
                kind == "STUDENT"
                and inv["person_type"] == "STUDENT"
                and inv["role_code"] == "STUDENT"
                and inv["admission_number"]
            ):
                eid = str(uuid4())
                connection.execute(
                    text(
                        "INSERT INTO students(student_id,institution_id,user_id,admission_number,status,created_at,updated_at) VALUES(:id,:iid,:uid,:number,'ACTIVE',now(),now())"
                    ),
                    {
                        "id": eid,
                        "iid": inv["institution_id"],
                        "uid": actor.user_id,
                        "number": inv["admission_number"],
                    },
                )
                entity = {"entityId": eid, "entityType": "student"}
            elif (
                kind in ("TEACHER", "STAFF")
                and inv["employee_number"]
                and inv["person_type"] == kind
                and inv["role_code"] == kind
            ):
                eid = str(uuid4())
                connection.execute(
                    text(
                        "INSERT INTO employees(employee_id,institution_id,user_id,employee_number,employee_type,designation,department,status,created_at,updated_at) VALUES(:id,:iid,:uid,:number,CAST(:etype AS \"EmployeeType\"),:designation,:department,'ACTIVE',now(),now())"
                    ),
                    {
                        "id": eid,
                        "iid": inv["institution_id"],
                        "uid": actor.user_id,
                        "number": inv["employee_number"],
                        "etype": inv["employee_type"],
                        "designation": inv["designation"],
                        "department": inv["department"],
                    },
                )
                entity = {"entityId": eid, "entityType": "employee"}
            else:
                raise ApplicationError(
                    409, "INVITATION_CONFIGURATION_INVALID", "Invitation cannot be claimed"
                )
            connection.execute(
                text(
                    "UPDATE onboarding_records SET status='CLAIMED',claimed_by_user_id=:uid,updated_at=now() WHERE onboarding_id=:id"
                ),
                {"uid": actor.user_id, "id": inv["onboarding_record_id"]},
            )
        connection.execute(
            text(
                "UPDATE invitations SET status='CLAIMED',claimed_at=:now,claimed_by_user_id=:uid,updated_at=:now WHERE invitation_id=:id"
            ),
            {"now": now, "uid": actor.user_id, "id": inv["invitation_id"]},
        )
        write_audit(
            connection,
            actor_user_id=actor.user_id,
            actor_membership_id=mid,
            institution_id=str(inv["institution_id"]),
            action=f"{kind.lower()}.invitation.claimed",
            entity_type="invitation",
            entity_id=str(inv["invitation_id"]),
            metadata={"entityId": entity["entityId"]} if entity else {},
        )
    return {
        "invitationId": inv["invitation_id"],
        "status": "CLAIMED",
        "claimedAt": now,
        "membershipId": mid,
        "role": inv["role_code"],
        "entity": entity,
    }
