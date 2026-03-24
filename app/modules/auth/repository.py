from sqlalchemy.orm import Session
from app.modules.auth.models import User, PasswordCredential
from app.common.password import hash_password


def create_user(db: Session, email: str) -> User:
    user = User(email=email, email_verified=True)
    db.add(user)
    db.flush()
    return user


def create_password(db: Session, user_id: str, password: str):
    password_entry = PasswordCredential(
        user_id=user_id,
        password_hash=hash_password(password)
    )
    db.add(password_entry)
    db.flush()