import uuid

from sqlalchemy.orm import Session
from app.modules.auth.models import User, PasswordCredential
from app.modules.auth.bloom import username_index
from app.common.password import hash_password


def create_user(
    db: Session,
    email: str,
    username: str | None = None,
    display_name: str | None = None,
) -> User:
    """Compatibility helper for internal registration flows.

    Public signup always supplies a user-chosen username. Older institutional
    flows receive a collision-resistant temporary handle until they are moved
    onto the universal signup flow.
    """
    fallback = f"user_{uuid.uuid4().hex[:12]}"
    user = User(
        email=email.strip().lower(),
        username=username or fallback,
        display_name=display_name or email.split("@", 1)[0],
        email_verified=True,
    )
    db.add(user)
    db.flush()
    username_index.add(user.username)
    return user


def create_password(db: Session, user_id: str, password: str):
    password_entry = PasswordCredential(
        user_id=user_id,
        password_hash=hash_password(password)
    )
    db.add(password_entry)
    db.flush()
