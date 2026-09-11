from __future__ import annotations

from time import time_ns

from fastapi.testclient import TestClient
from sqlalchemy import text

import app.auth as auth_module
from app.database import engine
from app.main import app


def main() -> None:
    email = f"auth-smoke-{time_ns()}@example.com"
    password = "SmokeTestPassword123"
    codes: list[str] = []
    original = auth_module.send_verification
    auth_module.send_verification = lambda _email, code: codes.append(code)
    client = TestClient(app)
    try:
        registered = client.post(
            "/api/v1/auth/register",
            json={
                "email": email,
                "password": password,
                "firstName": "Auth",
                "lastName": "Smoke",
            },
        )
        assert registered.status_code == 202 and codes
        verified = client.post("/api/v1/auth/verify-email", json={"email": email, "code": codes[0]})
        assert verified.status_code == 200
        logged_in = client.post("/api/v1/auth/login", json={"email": email, "password": password})
        assert logged_in.status_code == 200 and logged_in.json().get("accessToken")
        print("Auth smoke test passed: register, verify, and login all succeeded.")
    finally:
        auth_module.send_verification = original
        with engine.begin() as connection:
            connection.execute(text("DELETE FROM users WHERE email=:email"), {"email": email})


if __name__ == "__main__":
    main()
