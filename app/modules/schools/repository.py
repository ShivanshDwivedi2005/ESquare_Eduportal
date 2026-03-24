from sqlalchemy.orm import Session
from app.modules.schools.models import SchoolRegistrationRequest, School, SchoolMembership, Role


def create_request(db: Session, request):
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


def get_request_by_email(db: Session, email: str):
    return db.query(SchoolRegistrationRequest).filter_by(email=email).first()


def get_all_requests(db: Session):
    return db.query(SchoolRegistrationRequest).all()


def get_request_by_id(db: Session, request_id: str):
    return db.query(SchoolRegistrationRequest).filter_by(id=request_id).first()


def create_school(db: Session, school):
    db.add(school)
    db.flush()
    return school

def get_all_requests(db: Session):
    return db.query(SchoolRegistrationRequest).all()

def get_all_schools(db: Session):
    return db.query(School).all()


def get_requests_by_status(db: Session, status: str = None):
    query = db.query(SchoolRegistrationRequest)

    if status:
        query = query.filter_by(status=status)

    return query.all()


def create_membership(db: Session, user_id: str, school_id: str, role_name: str):
    role = db.query(Role).filter(Role.role_name == role_name).first()
    if not role:
        raise ValueError(f"Role {role_name} not found")
    
    membership = SchoolMembership(
        user_id=user_id,
        school_id=school_id,
        role_id=role.id
    )
    db.add(membership)
    db.flush()
    return membership