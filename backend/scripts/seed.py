from __future__ import annotations
import os
from uuid import uuid4
from sqlalchemy import text
from app.authorization import PERMISSION_DETAILS, ROLE_DETAILS, ROLE_GRANTS
from app.database import transaction
from app.security import hash_password


def stable_uuid(family: str, index: int) -> str:
    return f"00000000-0000-{family}-8000-{index + 1:012d}"


def main() -> None:
    with transaction(platform=True) as connection:
        permission_ids = {}
        for index, (code, description) in enumerate(PERMISSION_DETAILS.items()):
            pid = stable_uuid("4001", index)
            connection.execute(
                text(
                    "INSERT INTO permissions(permission_id,permission_code,description) VALUES(:id,:code,:description) ON CONFLICT(permission_code) DO UPDATE SET description=excluded.description"
                ),
                {"id": pid, "code": code, "description": description},
            )
            permission_ids[code] = connection.execute(
                text("SELECT permission_id FROM permissions WHERE permission_code=:code"),
                {"code": code},
            ).scalar_one()
        for index, (code, (name, description)) in enumerate(ROLE_DETAILS.items()):
            rid = stable_uuid("4000", index)
            connection.execute(
                text(
                    "INSERT INTO roles(role_id,role_code,display_name,description,created_at) VALUES(:id,:code,:name,:description,now()) ON CONFLICT(role_code) DO UPDATE SET display_name=excluded.display_name,description=excluded.description"
                ),
                {"id": rid, "code": code, "name": name, "description": description},
            )
            actual = connection.execute(
                text("SELECT role_id FROM roles WHERE role_code=:code"), {"code": code}
            ).scalar_one()
            connection.execute(
                text("DELETE FROM role_permissions WHERE role_id=:id"), {"id": actual}
            )
            for permission in ROLE_GRANTS[code]:
                connection.execute(
                    text(
                        "INSERT INTO role_permissions(role_id,permission_id) VALUES(:role,:permission) ON CONFLICT DO NOTHING"
                    ),
                    {"role": actual, "permission": permission_ids[permission]},
                )
        for code, name in (
            ("CBSE", "Central Board of Secondary Education"),
            ("CISCE", "Council for the Indian School Certificate Examinations"),
        ):
            connection.execute(
                text(
                    "INSERT INTO boards(board_id,board_code,display_name,created_at) VALUES(:id,:code,:name,now()) ON CONFLICT(board_code) DO UPDATE SET display_name=excluded.display_name"
                ),
                {"id": str(uuid4()), "code": code, "name": name},
            )
        email = os.getenv("SEED_PLATFORM_ADMIN_EMAIL", "").strip().lower()
        password = os.getenv("SEED_PLATFORM_ADMIN_PASSWORD")
        if email or password:
            if not email or not password or len(password) < 14:
                raise ValueError(
                    "SEED_PLATFORM_ADMIN_EMAIL and a password of at least 14 characters must be supplied together"
                )
            user = connection.execute(
                text("SELECT user_id FROM users WHERE email=:email"), {"email": email}
            ).scalar()
            if not user:
                user = str(uuid4())
                connection.execute(
                    text(
                        "INSERT INTO users(user_id,email,password_hash,status,email_verified_at,created_at,updated_at) VALUES(:id,:email,:password,'ACTIVE',now(),now(),now())"
                    ),
                    {"id": user, "email": email, "password": hash_password(password)},
                )
                connection.execute(
                    text(
                        "INSERT INTO user_profiles(user_id,first_name,last_name,created_at,updated_at) VALUES(:id,:first,:last,now(),now())"
                    ),
                    {
                        "id": user,
                        "first": os.getenv("SEED_PLATFORM_ADMIN_FIRST_NAME", "Platform").strip()
                        or "Platform",
                        "last": os.getenv("SEED_PLATFORM_ADMIN_LAST_NAME", "Administrator").strip()
                        or "Administrator",
                    },
                )
            connection.execute(
                text(
                    "INSERT INTO platform_user_roles(user_id,role,created_at) VALUES(:id,'PLATFORM_SUPER_ADMIN',now()) ON CONFLICT DO NOTHING"
                ),
                {"id": user},
            )


if __name__ == "__main__":
    main()
