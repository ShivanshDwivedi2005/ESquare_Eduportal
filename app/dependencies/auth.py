import uuid

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.common.jwt import decode_token
from app.dependencies.database import get_db
from app.modules.auth.models import User


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Sign in required")

    payload = decode_token(credentials.credentials, "access")
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Session expired")

    try:
        user_id = uuid.UUID(payload["sub"])
    except (TypeError, ValueError, AttributeError) as exc:
        raise HTTPException(status_code=401, detail="Session expired") from exc

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Session expired")
    return user
