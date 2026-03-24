from app.modules.students.models import Student, StudentProfile
import uuid


def create_student(db, school_id, membership_id):
    student = Student(
        school_id=school_id,
        membership_id=membership_id,
        student_unique_id=f"STU-{uuid.uuid4().hex[:8]}"
    )
    db.add(student)
    db.flush()
    return student


def create_student_profile(db, student, data):
    profile = StudentProfile(
        student_id=student.id,
        school_id=student.school_id,
        first_name=data.first_name,
        last_name=data.last_name,
        dob=data.dob,
        gender=data.gender,
        phone=data.phone,
        parent_name=data.parent_name,
        parent_phone=data.parent_phone,
        address=data.address
    )
    db.add(profile)
    return profile