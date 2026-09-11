from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import text

import app.auth as auth_module
from app.database import engine
from app.main import app
from app.security import create_access_token, hash_password


def test_authentication_and_school_approval_flow(monkeypatch) -> None:
    client = TestClient(app)
    submitter_email = f"flow-{uuid4().hex}@example.com"
    reviewer_email = f"review-{uuid4().hex}@example.com"
    password = "FastApiDatabase9Pass"
    reviewer_id = str(uuid4())
    codes: list[str] = []
    request_id = None
    institution_id = None
    monkeypatch.setattr(auth_module, "send_verification", lambda _email, code: codes.append(code))

    try:
        with engine.begin() as connection:
            connection.execute(
                text("""
                INSERT INTO users(user_id,email,password_hash,status,email_verified_at,created_at,updated_at)
                VALUES(:id,:email,:password,'ACTIVE',now(),now(),now())
            """),
                {"id": reviewer_id, "email": reviewer_email, "password": hash_password(password)},
            )
            connection.execute(
                text("""
                INSERT INTO user_profiles(user_id,first_name,last_name,created_at,updated_at)
                VALUES(:id,'Platform','Reviewer',now(),now())
            """),
                {"id": reviewer_id},
            )
            connection.execute(
                text("""
                INSERT INTO platform_user_roles(user_id,role,created_at)
                VALUES(:id,'PLATFORM_INSTITUTION_REVIEWER',now())
            """),
                {"id": reviewer_id},
            )

        registered = client.post(
            "/api/v1/auth/register",
            json={
                "email": submitter_email,
                "password": password,
                "firstName": "School",
                "lastName": "Owner",
            },
        )
        assert registered.status_code == 202 and codes
        assert (
            client.post(
                "/api/v1/auth/verify-email",
                json={
                    "email": submitter_email,
                    "code": codes[0],
                },
            ).status_code
            == 200
        )
        login = client.post(
            "/api/v1/auth/login", json={"email": submitter_email, "password": password}
        )
        assert login.status_code == 200
        submitter_headers = {"Authorization": f"Bearer {login.json()['accessToken']}"}
        reviewer_headers = {"Authorization": f"Bearer {create_access_token(reviewer_id)}"}

        created = client.post(
            "/api/v1/institution-requests",
            headers=submitter_headers,
            json={
                "institutionName": "FastAPI Flow School",
                "institutionType": "SCHOOL",
                "officialEmail": submitter_email,
                "officialPhone": "+919876543210",
                "addressLine1": "1 Test Road",
                "city": "Delhi",
                "state": "Delhi",
                "postalCode": "110001",
                "country": "IN",
            },
        )
        assert created.status_code == 201, created.text
        request_id = created.json()["requestId"]
        assert (
            client.post(
                f"/api/v1/platform/institution-requests/{request_id}/start-review",
                headers=reviewer_headers,
            ).status_code
            == 200
        )
        approved = client.post(
            f"/api/v1/platform/institution-requests/{request_id}/approve",
            headers=reviewer_headers,
        )
        assert approved.status_code == 200, approved.text
        institution_id = approved.json()["institution"]["institutionId"]
        profile = client.get("/api/v1/auth/me", headers=submitter_headers)
        assert any(
            item["institution"]["institutionId"] == institution_id
            for item in profile.json()["user"]["memberships"]
        )
    finally:
        with engine.begin() as connection:
            submitter_id = connection.execute(
                text("SELECT user_id FROM users WHERE email=:email"), {"email": submitter_email}
            ).scalar()
            if institution_id:
                connection.execute(
                    text("DELETE FROM audit_logs WHERE institution_id=:id"), {"id": institution_id}
                )
            connection.execute(
                text("DELETE FROM audit_logs WHERE actor_user_id=:id"), {"id": reviewer_id}
            )
            if submitter_id:
                connection.execute(
                    text("DELETE FROM audit_logs WHERE actor_user_id=:id"), {"id": submitter_id}
                )
            if request_id:
                connection.execute(
                    text("DELETE FROM institution_registration_requests WHERE request_id=:id"),
                    {"id": request_id},
                )
            if institution_id:
                connection.execute(
                    text(
                        "DELETE FROM membership_roles WHERE membership_id IN (SELECT membership_id FROM institution_memberships WHERE institution_id=:id)"
                    ),
                    {"id": institution_id},
                )
                connection.execute(
                    text("DELETE FROM institution_memberships WHERE institution_id=:id"),
                    {"id": institution_id},
                )
                connection.execute(
                    text("DELETE FROM institutions WHERE institution_id=:id"),
                    {"id": institution_id},
                )
            connection.execute(
                text("DELETE FROM platform_user_roles WHERE user_id=:id"), {"id": reviewer_id}
            )
            if submitter_id:
                connection.execute(
                    text("DELETE FROM users WHERE user_id=:id"), {"id": submitter_id}
                )
            connection.execute(text("DELETE FROM users WHERE user_id=:id"), {"id": reviewer_id})
