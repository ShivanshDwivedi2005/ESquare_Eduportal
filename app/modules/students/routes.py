from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.students.schemas import StudentCreate
from app.modules.students.service import register_student

router = APIRouter(prefix="/students", tags=["Students"])


# @router.post("/register")
# def register_student_api(data: StudentCreate, db: Session = Depends(get_db)):
#     student = register_student(db, data)
#     return {
#         "message": "Student registered successfully",
#         "student_id": student.id
#     }

@router.post("/register")
def register_student_api(data: StudentCreate, db: Session = Depends(get_db)):
    result = register_student(db, data)
    return result