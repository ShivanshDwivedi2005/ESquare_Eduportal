from uuid import uuid4

from app.schemas import AcademicSessionInput, RegisterInput
from app.security import create_access_token, hash_password, verify_access_token, verify_password


def test_access_token_round_trip_and_tamper_rejection() -> None:
    user_id = str(uuid4())
    token = create_access_token(user_id)
    assert verify_access_token(token) == user_id
    assert verify_access_token(token + "x") is None


def test_password_hash_round_trip() -> None:
    hashed = hash_password("CorrectHorseBattery9")
    assert hashed.startswith("$argon2id$")
    assert verify_password(hashed, "CorrectHorseBattery9")
    assert not verify_password(hashed, "incorrect")


def test_camel_case_requests_and_date_validation() -> None:
    model = RegisterInput.model_validate(
        {
            "email": " USER@example.com ",
            "password": "CorrectHorseBattery9",
            "firstName": "Ada",
            "lastName": "Lovelace",
        }
    )
    assert model.email == "user@example.com"
    session = AcademicSessionInput.model_validate(
        {
            "name": "2026-27",
            "startDate": "2026-06-01",
            "endDate": "2027-05-31",
        }
    )
    assert session.status == "DRAFT"
