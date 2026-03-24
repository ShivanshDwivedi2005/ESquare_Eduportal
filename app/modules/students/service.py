# from sqlalchemy.orm import Session

# from app.modules.students.repository import create_student, create_student_profile
# from app.modules.auth.repository import create_user, create_password
# from app.modules.schools.repository import create_membership
# from app.modules.schools.repository import get_all_schools
# from app.modules.schools.models import School

# def register_student(db: Session, data):

#     try:
#         # 1. Create user
#         user = create_user(db, data.email)

#         # 2. Create password
#         create_password(db, user.id, data.password)

#         # 3. Create membership (role = student)
#         validate_school(db, data.school_id)
#         membership = create_membership(
#             db,
#             user_id=user.id,
#             school_id=data.school_id,
#             role_name="student"
#         )

#         # 4. Create student
#         student = create_student(db, data.school_id, membership.id)

#         # 5. Create profile
#         create_student_profile(db, student, data)

#         db.commit()
#         return student

#     except Exception as e:
#         db.rollback()
#         raise e
    
# def validate_school(db, school_id):
#     school = db.query(School).filter(School.id == school_id).first()
#     if not school:
#         raise Exception("School does not exist")









from sqlalchemy.orm import Session
from fastapi import HTTPException
import traceback

from app.modules.students.repository import (
    create_student,
    create_student_profile
)
from app.modules.auth.repository import create_user, create_password
from app.modules.schools.repository import create_membership
from app.modules.schools.models import School
from app.modules.auth.models import User


# 🔍 Validation: School must exist
def validate_school(db: Session, school_id):
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School does not exist")
    return school


# 🔍 Validation: Email must be unique
def validate_email(db: Session, email):
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")


# 🚀 Main Service
def register_student(db: Session, data):
    try:
        # ✅ STEP 0: Validate inputs FIRST (fail fast)
        validate_school(db, data.school_id)
        validate_email(db, data.email)

        print("✅ Validation passed")

        # 1. Create user
        user = create_user(db, data.email)
        print("✅ User created")

        # 2. Create password
        create_password(db, user.id, data.password)
        print("✅ Password created")

        # 3. Create membership (role = student)
        membership = create_membership(
            db,
            user_id=user.id,
            school_id=data.school_id,
            role_name="student"
        )
        print("✅ Membership created")

        # 4. Create student
        student = create_student(db, data.school_id, membership.id)
        print("✅ Student created")

        # 5. Create profile
        create_student_profile(db, student, data)
        print("✅ Profile created")

        # ✅ Commit all changes
        db.commit()

        return {
            "message": "Student registered successfully",
            "student_id": str(student.id)
        }

    except HTTPException as e:
        db.rollback()
        raise e  # already clean error

    except Exception as e:
        db.rollback()
        print("❌ INTERNAL ERROR:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal Server Error")