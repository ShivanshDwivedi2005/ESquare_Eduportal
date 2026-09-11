from __future__ import annotations
from typing import Literal
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from .database import rows, transaction
from .dependencies import InstitutionActor, institution_actor

router = APIRouter(prefix="/api/v1/institutions", tags=["audit"])


@router.get("/{institution_id}/audit")
def list_audit(
    institution_id: UUID,
    limit: int = Query(50, ge=1, le=100),
    cursor: UUID | None = None,
    action: str | None = Query(None, pattern=r"^[a-z][a-z0-9_.]{1,149}$"),
    entity_type: str | None = Query(None, alias="entityType", pattern=r"^[a-z][a-z0-9_]{1,99}$"),
    sort: Literal["createdAt"] = "createdAt",
    direction: Literal["asc", "desc"] = "desc",
    actor: InstitutionActor = Depends(institution_actor(("AUDIT_VIEW",))),
) -> dict:
    op = "<" if direction == "desc" else ">"
    order = direction.upper()
    clauses = ["institution_id=:iid"]
    params = {"iid": institution_id, "limit": limit + 1}
    if action:
        clauses.append("action=:action")
        params["action"] = action
    if entity_type:
        clauses.append("entity_type=:etype")
        params["etype"] = entity_type
    if cursor:
        clauses.append(
            f"(created_at,audit_id){op}(SELECT created_at,audit_id FROM audit_logs WHERE audit_id=:cursor)"
        )
        params["cursor"] = cursor
    with transaction(user_id=actor.user_id, institution_id=actor.institution_id) as connection:
        items = rows(
            connection,
            f'SELECT audit_id AS "auditId",actor_user_id AS "actorUserId",actor_membership_id AS "actorMembershipId",action,entity_type AS "entityType",entity_id AS "entityId",metadata,created_at AS "createdAt" FROM audit_logs WHERE {" AND ".join(clauses)} ORDER BY created_at {order},audit_id {order} LIMIT :limit',
            params,
        )
    more = len(items) > limit
    shown = items[:limit]
    return {"items": shown, "nextCursor": shown[-1]["auditId"] if more else None}
