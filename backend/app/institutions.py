from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text

from .audit import write_audit
from .database import row, rows, transaction
from .dependencies import InstitutionActor, institution_actor
from .errors import ApplicationError
from .schemas import UpdateRolesInput

router = APIRouter(prefix="/api/v1/institutions", tags=["institutions"])
ADMIN_ROLES = ("ROOT_ADMIN", "ADMISSION_ADMIN", "FINANCE_ADMIN", "PRINCIPAL")


@router.get("/{institution_id}")
def view_institution(
    institution_id: UUID,
    actor: InstitutionActor = Depends(institution_actor(("INSTITUTION_VIEW",))),
) -> dict:
    with transaction(user_id=actor.user_id, institution_id=actor.institution_id) as connection:
        item = row(
            connection,
            'SELECT i.institution_id AS "institutionId",i.institution_code AS "institutionCode",i.institution_name AS "institutionName",i.institution_type AS "institutionType",i.status,i.created_at AS "createdAt",b.board_code AS "boardCode",b.display_name AS "boardName" FROM institutions i LEFT JOIN boards b USING(board_id) WHERE i.institution_id=:id AND i.status=\'ACTIVE\'',
            {"id": institution_id},
        )
    if not item:
        raise ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found")
    board = (
        {"boardCode": item.pop("boardCode"), "displayName": item.pop("boardName")}
        if item["boardCode"]
        else None
    )
    item["board"] = board
    return item


@router.get("/{institution_id}/admins")
def list_admins(
    institution_id: UUID,
    limit: int = Query(25, ge=1, le=100),
    cursor: UUID | None = None,
    actor: InstitutionActor = Depends(institution_actor(("ADMIN_VIEW",))),
) -> dict:
    params = {"id": institution_id, "limit": limit + 1}
    cursor_clause = ""
    if cursor:
        cursor_clause = "AND (m.joined_at,m.membership_id) > (SELECT joined_at,membership_id FROM institution_memberships WHERE membership_id=:cursor)"
        params["cursor"] = cursor
    with transaction(user_id=actor.user_id, institution_id=actor.institution_id) as connection:
        records = rows(
            connection,
            f"""SELECT DISTINCT m.membership_id,m.status,m.joined_at,m.left_at,u.user_id,u.email,u.phone,
                p.first_name,p.middle_name,p.last_name
            FROM institution_memberships m JOIN users u USING(user_id) LEFT JOIN user_profiles p USING(user_id)
            WHERE m.institution_id=:id AND EXISTS(SELECT 1 FROM membership_roles mr JOIN roles r USING(role_id)
              WHERE mr.membership_id=m.membership_id AND r.role_code IN ('ROOT_ADMIN','ADMISSION_ADMIN','FINANCE_ADMIN','PRINCIPAL'))
              {cursor_clause} ORDER BY m.joined_at,m.membership_id LIMIT :limit""",
            params,
        )
        items = []
        for record in records:
            roles_for_member = rows(
                connection,
                'SELECT r.role_code AS "roleCode",r.display_name AS "displayName" FROM membership_roles mr JOIN roles r USING(role_id) WHERE mr.membership_id=:id ORDER BY r.role_code',
                {"id": record["membership_id"]},
            )
            items.append(
                {
                    "membershipId": record["membership_id"],
                    "status": record["status"],
                    "joinedAt": record["joined_at"],
                    "leftAt": record["left_at"],
                    "user": {
                        "userId": record["user_id"],
                        "email": record["email"],
                        "phone": record["phone"],
                        "profile": {
                            "firstName": record["first_name"],
                            "middleName": record["middle_name"],
                            "lastName": record["last_name"],
                        }
                        if record["first_name"]
                        else None,
                    },
                    "roles": [{"role": r} for r in roles_for_member],
                }
            )
    more = len(items) > limit
    shown = items[:limit]
    return {"items": shown, "nextCursor": shown[-1]["membershipId"] if more else None}


@router.patch("/{institution_id}/members/{membership_id}/roles")
def update_roles(
    institution_id: UUID,
    membership_id: UUID,
    payload: UpdateRolesInput,
    actor: InstitutionActor = Depends(institution_actor(("ADMIN_ASSIGN_ROLE",))),
) -> dict:
    if "ROOT_ADMIN" not in actor.role_codes:
        raise ApplicationError(403, "ROLE_ASSIGNMENT_DENIED", "Role cannot be assigned")
    requested = set(payload.add + payload.remove)
    if any(code not in ("ADMISSION_ADMIN", "FINANCE_ADMIN", "PRINCIPAL") for code in requested):
        raise ApplicationError(403, "ROLE_ASSIGNMENT_DENIED", "Role cannot be assigned")
    with transaction(user_id=actor.user_id, institution_id=actor.institution_id) as connection:
        target = row(
            connection,
            "SELECT membership_id,status FROM institution_memberships WHERE membership_id=:mid AND institution_id=:iid AND status IN ('PENDING','ACTIVE','SUSPENDED')",
            {"mid": membership_id, "iid": institution_id},
        )
        if not target:
            raise ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found")
        role_rows = rows(
            connection,
            "SELECT role_id,role_code,display_name FROM roles WHERE role_code IN ('ADMISSION_ADMIN','FINANCE_ADMIN','PRINCIPAL')",
        )
        by_code = {r["role_code"]: r for r in role_rows}
        if not requested.issubset(by_code):
            raise ApplicationError(422, "UNKNOWN_ROLE", "Request validation failed")
        for code in payload.add:
            connection.execute(
                text(
                    "INSERT INTO membership_roles(membership_id,role_id,assigned_by_membership_id,assigned_at) VALUES(:mid,:rid,:actor,now()) ON CONFLICT DO NOTHING"
                ),
                {
                    "mid": membership_id,
                    "rid": by_code[code]["role_id"],
                    "actor": actor.membership_id,
                },
            )
            write_audit(
                connection,
                actor_user_id=actor.user_id,
                actor_membership_id=actor.membership_id,
                institution_id=actor.institution_id,
                action="admin.role.assigned",
                entity_type="institution_membership",
                entity_id=str(membership_id),
                metadata={"roleCode": code},
                ip_address=actor.ip_address,
                user_agent=actor.user_agent,
            )
        for code in payload.remove:
            connection.execute(
                text("DELETE FROM membership_roles WHERE membership_id=:mid AND role_id=:rid"),
                {"mid": membership_id, "rid": by_code[code]["role_id"]},
            )
            write_audit(
                connection,
                actor_user_id=actor.user_id,
                actor_membership_id=actor.membership_id,
                institution_id=actor.institution_id,
                action="admin.role.removed",
                entity_type="institution_membership",
                entity_id=str(membership_id),
                metadata={"roleCode": code},
                ip_address=actor.ip_address,
                user_agent=actor.user_agent,
            )
        current = rows(
            connection,
            'SELECT r.role_code AS "roleCode",r.display_name AS "displayName" FROM membership_roles mr JOIN roles r USING(role_id) WHERE mr.membership_id=:id ORDER BY r.role_code',
            {"id": membership_id},
        )
    return {
        "membershipId": membership_id,
        "status": target["status"],
        "roles": [{"role": item} for item in current],
    }


@router.post("/{institution_id}/members/{membership_id}/suspend")
def suspend_member(
    institution_id: UUID,
    membership_id: UUID,
    actor: InstitutionActor = Depends(institution_actor(("ADMIN_DISABLE",))),
) -> dict:
    if str(membership_id) == actor.membership_id:
        raise ApplicationError(409, "SELF_SUSPENSION_DENIED", "You cannot suspend yourself")
    with transaction(user_id=actor.user_id, institution_id=actor.institution_id) as connection:
        target = row(
            connection,
            "SELECT m.membership_id FROM institution_memberships m WHERE m.membership_id=:mid AND m.institution_id=:iid AND m.status='ACTIVE' FOR UPDATE",
            {"mid": membership_id, "iid": institution_id},
        )
        if not target:
            raise ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found")
        if row(
            connection,
            "SELECT 1 FROM membership_roles mr JOIN roles r USING(role_id) WHERE mr.membership_id=:id AND r.role_code='ROOT_ADMIN'",
            {"id": membership_id},
        ):
            raise ApplicationError(
                409, "ROOT_ADMIN_PROTECTED", "Root administrator cannot be suspended"
            )
        updated = row(
            connection,
            'UPDATE institution_memberships SET status=\'SUSPENDED\',updated_at=now() WHERE membership_id=:id RETURNING membership_id AS "membershipId",status,updated_at AS "updatedAt"',
            {"id": membership_id},
        )
        write_audit(
            connection,
            actor_user_id=actor.user_id,
            actor_membership_id=actor.membership_id,
            institution_id=actor.institution_id,
            action="admin.suspended",
            entity_type="institution_membership",
            entity_id=str(membership_id),
            ip_address=actor.ip_address,
            user_agent=actor.user_agent,
        )
    return updated or {}
