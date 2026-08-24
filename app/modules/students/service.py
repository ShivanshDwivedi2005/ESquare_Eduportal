
from sqlalchemy.orm import Session
from fastapi import HTTPException
import traceback

from app.modules.students.repository import (
    create_student,
    create_student_profile
)
from app.modules.auth.repository import create_user, create_password
from app.modules.schools.repository import create_membership
from app.modules.schools.models import School, SchoolMembership
from app.modules.auth.models import User


#  Validation: School must exist
def validate_school(db: Session, school_id):
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School does not exist")
    return school


#  Validation: Email must be unique
def validate_email(db: Session, email):
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")


#  Main Service
def register_student(db: Session, data):
    try:
        # STEP 1: Validate school
        validate_school(db, data.school_id)

        # STEP 2: Check if user exists
        user = db.query(User).filter(User.email == data.email).first()

        if not user:
            # ✅ NEW USER FLOW
            user = create_user(db, data.email)
            create_password(db, user.id, data.password)

        else:
            # ❗ IMPORTANT: do NOT recreate password
            # ❗ ignore incoming password
            pass

        # STEP 3: Check membership
        membership = db.query(SchoolMembership).filter(
            SchoolMembership.user_id == user.id,
            SchoolMembership.school_id == data.school_id
        ).first()

        if membership:
            if membership.status == "active":
                raise HTTPException(400, "Student already registered in this school")

            # 🔥 Reactivate old membership
            membership.status = "active"

        else:
            # ✅ Create new membership
            membership = create_membership(
                db,
                user_id=user.id,
                school_id=data.school_id,
                role_name="student"
            )

        # STEP 4: Create new student record ALWAYS
        student = create_student(db, data.school_id, membership.id)

        # STEP 5: Create profile
        create_student_profile(db, student, data)

        db.commit()

        return {
            "message": "Student registered successfully",
            "student_id": str(student.id)
        }

    except HTTPException as e:
        db.rollback()
        raise e

    except Exception as e:
        db.rollback()
        traceback.print_exc()
        raise HTTPException(500, "Internal Server Error")