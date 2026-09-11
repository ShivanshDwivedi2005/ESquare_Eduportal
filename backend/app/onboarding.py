from __future__ import annotations

from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import text

from .audit import write_audit
from .database import row, rows, transaction
from .dependencies import InstitutionActor, institution_actor
from .errors import ApplicationError
from .invitations import create_onboarding_invitation
from .mail import send_invitation
from .schemas import StaffOnboardingInput, StudentOnboardingInput, TeacherOnboardingInput

router = APIRouter(prefix="/api/v1/institutions", tags=["onboarding"])


def _role(connection, code: str) -> dict:
    result = row(connection, "SELECT role_id FROM roles WHERE role_code=:code", {"code": code})
    if not result:
        raise ApplicationError(500, "AUTHORIZATION_CATALOG_MISSING", "Configuration error", False)
    return result


def _record(connection, onboarding_id) -> dict:
    result = row(
        connection,
        """SELECT o.onboarding_id AS "onboardingId",o.institution_id AS "institutionId",o.person_type AS "personType",
      o.first_name AS "firstName",o.middle_name AS "middleName",o.last_name AS "lastName",o.email,o.phone,o.date_of_birth AS "dateOfBirth",
      o.status,o.claimed_by_user_id AS "claimedByUserId",o.created_at AS "createdAt",o.updated_at AS "updatedAt",
      sd.admission_number AS "admissionNumber",sd.academic_session_id AS "academicSessionId",sd.class_section_id AS "classSectionId",
      sd.guardian_name AS "guardianName",sd.guardian_phone AS "guardianPhone",sd.admission_date AS "admissionDate",
      ed.employee_number AS "employeeNumber",ed.employee_type AS "employeeType",ed.designation,ed.department,ed.joining_date AS "joiningDate",
      i.invitation_id AS "invitationId",i.status AS "invitationStatus",i.expires_at AS "invitationExpiresAt",i.claimed_at AS "invitationClaimedAt"
      FROM onboarding_records o LEFT JOIN student_onboarding_details sd USING(onboarding_id)
      LEFT JOIN employee_onboarding_details ed USING(onboarding_id) LEFT JOIN invitations i ON i.onboarding_record_id=o.onboarding_id
      WHERE o.onboarding_id=:id""",
        {"id": onboarding_id},
    )
    if not result:
        raise ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found")
    student = None
    if result["admissionNumber"]:
        student = {
            key: result.pop(key)
            for key in (
                "admissionNumber",
                "academicSessionId",
                "classSectionId",
                "guardianName",
                "guardianPhone",
                "admissionDate",
            )
        }
    else:
        for key in (
            "admissionNumber",
            "academicSessionId",
            "classSectionId",
            "guardianName",
            "guardianPhone",
            "admissionDate",
        ):
            result.pop(key)
    employee = None
    if result["employeeNumber"]:
        employee = {
            key: result.pop(key)
            for key in (
                "employeeNumber",
                "employeeType",
                "designation",
                "department",
                "joiningDate",
            )
        }
    else:
        for key in ("employeeNumber", "employeeType", "designation", "department", "joiningDate"):
            result.pop(key)
    invitation = None
    if result["invitationId"]:
        invitation = {
            "invitationId": result.pop("invitationId"),
            "status": result.pop("invitationStatus"),
            "expiresAt": result.pop("invitationExpiresAt"),
            "claimedAt": result.pop("invitationClaimedAt"),
        }
    else:
        for key in (
            "invitationId",
            "invitationStatus",
            "invitationExpiresAt",
            "invitationClaimedAt",
        ):
            result.pop(key)
    result["studentDetails"] = student
    result["employeeDetails"] = employee
    result["invitation"] = invitation
    return result


def _create_common(connection, payload, actor: InstitutionActor, person_type: str) -> str:
    oid = str(uuid4())
    data = payload.model_dump()
    connection.execute(
        text("""INSERT INTO onboarding_records(onboarding_id,institution_id,person_type,first_name,middle_name,last_name,email,phone,date_of_birth,status,created_by_membership_id,created_at,updated_at)
      VALUES(:id,:iid,CAST(:ptype AS \"PersonType\"),:first_name,:middle_name,:last_name,:email,:phone,:date_of_birth,'INVITED',:creator,now(),now())"""),
        {
            "id": oid,
            "iid": actor.institution_id,
            "ptype": person_type,
            "creator": actor.membership_id,
            **{
                k: data.get(k)
                for k in (
                    "first_name",
                    "middle_name",
                    "last_name",
                    "email",
                    "phone",
                    "date_of_birth",
                )
            },
        },
    )
    return oid


def _audits(connection, actor: InstitutionActor, oid: str, iid: str, prefix: str) -> None:
    common = {
        "actor_user_id": actor.user_id,
        "actor_membership_id": actor.membership_id,
        "institution_id": actor.institution_id,
        "ip_address": actor.ip_address,
        "user_agent": actor.user_agent,
    }
    write_audit(
        connection,
        **common,
        action=f"{prefix}.onboarding.created",
        entity_type="onboarding_record",
        entity_id=oid,
    )
    write_audit(
        connection,
        **common,
        action=f"{prefix}.invitation.sent",
        entity_type="invitation",
        entity_id=iid,
    )


@router.post("/{institution_id}/onboarding/students", status_code=status.HTTP_201_CREATED)
def create_student(
    institution_id: UUID,
    payload: StudentOnboardingInput,
    actor: InstitutionActor = Depends(institution_actor(("STUDENT_CREATE",))),
) -> dict:
    with transaction(user_id=actor.user_id, institution_id=actor.institution_id) as connection:
        section = row(
            connection,
            """SELECT 1 FROM class_sections c JOIN academic_sessions s USING(academic_session_id)
          WHERE c.class_section_id=:cid AND c.institution_id=:iid AND c.academic_session_id=:sid AND c.status='ACTIVE' AND s.institution_id=:iid AND s.status='ACTIVE'""",
            {
                "cid": payload.class_section_id,
                "iid": institution_id,
                "sid": payload.academic_session_id,
            },
        )
        if not section:
            raise ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found")
        role = _role(connection, "STUDENT")
        oid = _create_common(connection, payload, actor, "STUDENT")
        connection.execute(
            text("""INSERT INTO student_onboarding_details(onboarding_id,institution_id,admission_number,academic_session_id,class_section_id,guardian_name,guardian_phone,admission_date)
          VALUES(:oid,:iid,:number,:session,:section,:guardian,:phone,:date)"""),
            {
                "oid": oid,
                "iid": institution_id,
                "number": payload.admission_number,
                "session": payload.academic_session_id,
                "section": payload.class_section_id,
                "guardian": payload.guardian_name,
                "phone": payload.guardian_phone,
                "date": payload.admission_date,
            },
        )
        invitation = create_onboarding_invitation(
            connection,
            actor.institution_id,
            oid,
            str(payload.email),
            "STUDENT",
            role["role_id"],
            actor.membership_id,
        )
        institution = row(
            connection,
            "SELECT institution_name FROM institutions WHERE institution_id=:id",
            {"id": institution_id},
        )
        _audits(connection, actor, oid, invitation["invitationId"], "student")
        result = _record(connection, oid)
    send_invitation(
        str(payload.email), invitation["rawToken"], institution["institution_name"], "STUDENT"
    )
    result["invitationId"] = invitation["invitationId"]
    return result


def _create_employee(
    institution_id: UUID,
    payload,
    actor: InstitutionActor,
    employee_type: str,
    person_type: str,
    kind: str,
    role_code: str,
) -> dict:
    with transaction(user_id=actor.user_id, institution_id=actor.institution_id) as connection:
        role = _role(connection, role_code)
        oid = _create_common(connection, payload, actor, person_type)
        connection.execute(
            text("""INSERT INTO employee_onboarding_details(onboarding_id,institution_id,employee_number,employee_type,designation,department,joining_date)
          VALUES(:oid,:iid,:number,CAST(:etype AS \"EmployeeType\"),:designation,:department,:date)"""),
            {
                "oid": oid,
                "iid": institution_id,
                "number": payload.employee_number,
                "etype": employee_type,
                "designation": payload.designation,
                "department": payload.department,
                "date": payload.joining_date,
            },
        )
        invitation = create_onboarding_invitation(
            connection,
            actor.institution_id,
            oid,
            str(payload.email),
            kind,
            role["role_id"],
            actor.membership_id,
        )
        institution = row(
            connection,
            "SELECT institution_name FROM institutions WHERE institution_id=:id",
            {"id": institution_id},
        )
        _audits(connection, actor, oid, invitation["invitationId"], person_type.lower())
        result = _record(connection, oid)
    send_invitation(
        str(payload.email), invitation["rawToken"], institution["institution_name"], kind
    )
    result["invitationId"] = invitation["invitationId"]
    return result


@router.post("/{institution_id}/onboarding/teachers", status_code=201)
def create_teacher(
    institution_id: UUID,
    payload: TeacherOnboardingInput,
    actor: InstitutionActor = Depends(institution_actor(("TEACHER_CREATE",))),
) -> dict:
    return _create_employee(
        institution_id, payload, actor, "TEACHER", "TEACHER", "TEACHER", "TEACHER"
    )


@router.post("/{institution_id}/onboarding/staff", status_code=201)
def create_staff(
    institution_id: UUID,
    payload: StaffOnboardingInput,
    actor: InstitutionActor = Depends(institution_actor(("STAFF_CREATE",))),
) -> dict:
    return _create_employee(
        institution_id, payload, actor, payload.employee_type, "STAFF", "STAFF", "STAFF"
    )


@router.get("/{institution_id}/onboarding")
def list_onboarding(
    institution_id: UUID,
    limit: int = Query(25, ge=1, le=100),
    cursor: UUID | None = None,
    person_type: str | None = Query(None, alias="personType", pattern="^(STUDENT|TEACHER|STAFF)$"),
    status_filter: str | None = Query(
        None, alias="status", pattern="^(DRAFT|READY|INVITED|CLAIMED|CANCELLED)$"
    ),
    actor: InstitutionActor = Depends(
        institution_actor(("STUDENT_VIEW", "TEACHER_VIEW", "STAFF_VIEW"))
    ),
) -> dict:
    clauses = ["institution_id=:iid"]
    params = {"iid": institution_id, "limit": limit + 1}
    if person_type:
        clauses.append('person_type=CAST(:ptype AS "PersonType")')
        params["ptype"] = person_type
    if status_filter:
        clauses.append('status=CAST(:state AS "OnboardingStatus")')
        params["state"] = status_filter
    if cursor:
        clauses.append(
            "(created_at,onboarding_id)<(SELECT created_at,onboarding_id FROM onboarding_records WHERE onboarding_id=:cursor)"
        )
        params["cursor"] = cursor
    with transaction(user_id=actor.user_id, institution_id=actor.institution_id) as connection:
        ids = rows(
            connection,
            f"SELECT onboarding_id FROM onboarding_records WHERE {' AND '.join(clauses)} ORDER BY created_at DESC,onboarding_id DESC LIMIT :limit",
            params,
        )
        items = [_record(connection, item["onboarding_id"]) for item in ids]
    more = len(items) > limit
    shown = items[:limit]
    return {"items": shown, "nextCursor": shown[-1]["onboardingId"] if more else None}
