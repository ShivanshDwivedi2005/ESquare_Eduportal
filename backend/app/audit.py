from __future__ import annotations

import json
from uuid import uuid4

from sqlalchemy import text
from sqlalchemy.engine import Connection


def write_audit(
    connection: Connection,
    *,
    actor_user_id: str,
    action: str,
    entity_type: str,
    entity_id: str,
    institution_id: str | None = None,
    actor_membership_id: str | None = None,
    metadata: dict | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> None:
    connection.execute(
        text("""
        INSERT INTO audit_logs
          (audit_id, institution_id, actor_user_id, actor_membership_id, action,
           entity_type, entity_id, metadata, ip_address, user_agent, created_at)
        VALUES (:audit_id, :institution_id, :actor_user_id, :actor_membership_id,
                :action, :entity_type, :entity_id, CAST(:metadata AS jsonb),
                CAST(:ip_address AS inet), :user_agent, now())
    """),
        {
            "audit_id": str(uuid4()),
            "institution_id": institution_id,
            "actor_user_id": actor_user_id,
            "actor_membership_id": actor_membership_id,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "metadata": json.dumps(metadata or {}),
            "ip_address": ip_address,
            "user_agent": user_agent[:500] if user_agent else None,
        },
    )
