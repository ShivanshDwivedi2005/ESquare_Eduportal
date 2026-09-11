from fastapi.testclient import TestClient

from app.main import app


def test_every_legacy_api_path_is_registered() -> None:
    actual = {route.path for route in app.routes}
    expected = {
        "/api/v1/auth/register",
        "/api/v1/auth/verify-email",
        "/api/v1/auth/resend-verification",
        "/api/v1/auth/login",
        "/api/v1/auth/google",
        "/api/v1/auth/refresh",
        "/api/v1/auth/logout",
        "/api/v1/auth/forgot-password",
        "/api/v1/auth/reset-password",
        "/api/v1/auth/me",
        "/api/v1/boards",
        "/api/v1/institution-requests",
        "/api/v1/institution-requests/me",
        "/api/v1/institution-requests/{request_id}",
        "/api/v1/platform/institution-requests",
        "/api/v1/platform/institution-requests/{request_id}",
        "/api/v1/platform/institution-requests/{request_id}/start-review",
        "/api/v1/platform/institution-requests/{request_id}/approve",
        "/api/v1/platform/institution-requests/{request_id}/reject",
        "/api/v1/institutions/{institution_id}",
        "/api/v1/institutions/{institution_id}/admins",
        "/api/v1/institutions/{institution_id}/members/{membership_id}/roles",
        "/api/v1/institutions/{institution_id}/members/{membership_id}/suspend",
        "/api/v1/institutions/{institution_id}/admin-invitations",
        "/api/v1/institutions/{institution_id}/invitations",
        "/api/v1/institutions/{institution_id}/invitations/{invitation_id}/resend",
        "/api/v1/institutions/{institution_id}/invitations/{invitation_id}/revoke",
        "/api/v1/invitations/validate",
        "/api/v1/invitations/accept",
        "/api/v1/institutions/{institution_id}/onboarding/students",
        "/api/v1/institutions/{institution_id}/onboarding/teachers",
        "/api/v1/institutions/{institution_id}/onboarding/staff",
        "/api/v1/institutions/{institution_id}/onboarding",
        "/api/v1/institutions/{institution_id}/academic-sessions",
        "/api/v1/institutions/{institution_id}/class-sections",
        "/api/v1/institutions/{institution_id}/audit",
    }
    assert expected <= actual


def test_live_health_and_error_contract() -> None:
    client = TestClient(app)
    assert client.get("/health/live").json() == {"status": "ok"}
    response = client.post("/api/v1/auth/login", json={"email": "invalid"})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
    assert response.headers["x-request-id"]


def test_authentication_is_required() -> None:
    response = TestClient(app).get("/api/v1/auth/me")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTHENTICATION_REQUIRED"
