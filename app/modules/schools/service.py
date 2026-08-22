import random
import string
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.modules.schools import repository
from app.modules.schools.models import SchoolRegistrationRequest, School

from app.modules.auth.models import User
from app.modules.schools.models import SchoolMembership

from app.common.password import hash_password


def generate_school_code():
    return "SCHL-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))


# ✅ Submit request
def submit_school_request(db: Session, data):

    existing = repository.get_request_by_email(db, data.email)
    if existing:
        return {"error": "Request already exists"}

    request = SchoolRegistrationRequest(
        school_name=data.school_name,
        email=data.email,
        phone=data.phone,
        address=data.address,
        admin_name=data.admin_name,
        password_hash=hash_password(data.password)
    )

    repository.create_request(db, request)

    return {"message": "Request submitted"}

def approve_request(db: Session, request_id: str):

    req = repository.get_request_by_id(db, request_id)

    if not req:
        return {"error": "Request not found"}

    if req.status != "pending":
        return {"error": "Already processed"}

    user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user or not user.email_verified:
        raise HTTPException(
            status_code=409,
            detail="The institution administrator must create and verify an ESQUARE account first",
        )

    # 1. Generate school code
    code = generate_school_code()

    # 2. Create school
    school = School(
        name=req.school_name,
        unique_code=code
    )
    repository.create_school(db, school)

    # 3. Assign the approved role to the administrator's existing account.
    membership = SchoolMembership(
        user_id=user.id,
        school_id=school.id,
        role_id=4
    )
    db.add(membership)

    # 4. Update request
    req.status = "approved"

    db.commit()

    return {
        "message": "School approved",
        "school_code": code
    }

def list_requests(db, status):
    return db.query(SchoolRegistrationRequest)\
             .filter_by(status=status)\
             .all()

def get_approved_schools(db: Session):
    return repository.get_all_schools(db)


def reject_request(db: Session, request_id: str):

    req = repository.get_request_by_id(db, request_id)

    if not req:
        return {"error": "Request not found"}

    if req.status != "pending":
        return {"error": "Already processed"}

    req.status = "rejected"

    db.commit()

    return {"message": "Request rejected"}


def list_requests(db: Session, status: str = None):
    return repository.get_requests_by_status(db, status)
