from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.modules.schools.schemas import SchoolRequestCreate
from app.modules.schools import service
from app.dependencies.database import get_db

router = APIRouter(prefix="/schools", tags=["Schools"])


# ✅ 1. Submit request
@router.post("/request")
def request_school(data: SchoolRequestCreate, db: Session = Depends(get_db)):
    return service.submit_school_request(db, data)


# ✅ 2. View requests (admin)
@router.get("/requests")
def get_requests(status: str = "pending", db: Session = Depends(get_db)):
    return service.list_requests(db, status)


# ✅ 3. Approve
@router.post("/approve/{request_id}")
def approve_school(request_id: UUID, db: Session = Depends(get_db)):
    return service.approve_request(db, request_id)


@router.get("/approved")
def get_schools(db: Session = Depends(get_db)):
    schools = service.get_approved_schools(db)

    return [
        {
            "id": str(s.id),
            "name": s.name,
            "code": s.unique_code
        }
        for s in schools
    ]

@router.post("/reject/{request_id}")
def reject_school(request_id: str, db: Session = Depends(get_db)):
    return service.reject_request(db, request_id)


@router.get("/requests")
def get_requests(status: str = None, db: Session = Depends(get_db)):
    requests = service.list_requests(db, status)

    return [
        {
            "id": str(r.id),
            "school_name": r.school_name,
            "email": r.email,
            "status": r.status
        }
        for r in requests
    ]