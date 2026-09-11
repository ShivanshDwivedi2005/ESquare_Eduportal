from __future__ import annotations

from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, Query
from .audit import write_audit
from .database import row, rows, transaction
from .dependencies import InstitutionActor, institution_actor
from .errors import ApplicationError
from .schemas import AcademicSessionInput, ClassSectionInput

router = APIRouter(prefix="/api/v1/institutions", tags=["academics"])


@router.post("/{institution_id}/academic-sessions", status_code=201)
def create_session(
    institution_id: UUID,
    payload: AcademicSessionInput,
    actor: InstitutionActor = Depends(institution_actor(("ACADEMIC_SESSION_MANAGE",))),
) -> dict:
    sid = str(uuid4())
    with transaction(user_id=actor.user_id, institution_id=actor.institution_id) as connection:
        item = row(
            connection,
            'INSERT INTO academic_sessions(academic_session_id,institution_id,name,start_date,end_date,status,created_at,updated_at) VALUES(:id,:iid,:name,:start,:end,CAST(:state AS "AcademicStatus"),now(),now()) RETURNING academic_session_id AS "academicSessionId",name,start_date AS "startDate",end_date AS "endDate",status',
            {
                "id": sid,
                "iid": institution_id,
                "name": payload.name.strip(),
                "start": payload.start_date,
                "end": payload.end_date,
                "state": payload.status,
            },
        )
        write_audit(
            connection,
            actor_user_id=actor.user_id,
            actor_membership_id=actor.membership_id,
            institution_id=actor.institution_id,
            action="academic.session.created",
            entity_type="academic_session",
            entity_id=sid,
            ip_address=actor.ip_address,
            user_agent=actor.user_agent,
        )
    return item or {}


@router.get("/{institution_id}/academic-sessions")
def list_sessions(
    institution_id: UUID,
    limit: int = Query(50, ge=1, le=100),
    cursor: UUID | None = None,
    status_filter: str | None = Query(None, alias="status", pattern="^(DRAFT|ACTIVE|ARCHIVED)$"),
    actor: InstitutionActor = Depends(institution_actor(("INSTITUTION_VIEW",))),
) -> dict:
    clauses = ["institution_id=:iid"]
    params = {"iid": institution_id, "limit": limit + 1}
    if status_filter:
        clauses.append('status=CAST(:state AS "AcademicStatus")')
        params["state"] = status_filter
    if cursor:
        clauses.append(
            "(start_date,academic_session_id)<(SELECT start_date,academic_session_id FROM academic_sessions WHERE academic_session_id=:cursor)"
        )
        params["cursor"] = cursor
    with transaction(user_id=actor.user_id, institution_id=actor.institution_id) as connection:
        items = rows(
            connection,
            f'SELECT academic_session_id AS "academicSessionId",name,start_date AS "startDate",end_date AS "endDate",status FROM academic_sessions WHERE {" AND ".join(clauses)} ORDER BY start_date DESC,academic_session_id DESC LIMIT :limit',
            params,
        )
    more = len(items) > limit
    shown = items[:limit]
    return {"items": shown, "nextCursor": shown[-1]["academicSessionId"] if more else None}


@router.post("/{institution_id}/class-sections", status_code=201)
def create_class_section(
    institution_id: UUID,
    payload: ClassSectionInput,
    actor: InstitutionActor = Depends(institution_actor(("CLASS_SECTION_MANAGE",))),
) -> dict:
    cid = str(uuid4())
    with transaction(user_id=actor.user_id, institution_id=actor.institution_id) as connection:
        if not row(
            connection,
            "SELECT 1 FROM academic_sessions WHERE academic_session_id=:id AND institution_id=:iid",
            {"id": payload.academic_session_id, "iid": institution_id},
        ):
            raise ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found")
        item = row(
            connection,
            'INSERT INTO class_sections(class_section_id,institution_id,academic_session_id,class_level,section,stream,status,created_at,updated_at) VALUES(:id,:iid,:sid,:level,:section,:stream,CAST(:state AS "AcademicStatus"),now(),now()) RETURNING class_section_id AS "classSectionId",academic_session_id AS "academicSessionId",class_level AS "classLevel",section,stream,status',
            {
                "id": cid,
                "iid": institution_id,
                "sid": payload.academic_session_id,
                "level": payload.class_level.strip(),
                "section": payload.section.strip(),
                "stream": payload.stream.strip() if payload.stream else None,
                "state": payload.status,
            },
        )
        write_audit(
            connection,
            actor_user_id=actor.user_id,
            actor_membership_id=actor.membership_id,
            institution_id=actor.institution_id,
            action="academic.class_section.created",
            entity_type="class_section",
            entity_id=cid,
            ip_address=actor.ip_address,
            user_agent=actor.user_agent,
        )
    return item or {}
