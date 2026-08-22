import hashlib
import hmac
import secrets

from app.core.config import settings


def generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_otp(email: str, otp: str) -> str:
    message = f"{email.strip().lower()}:{otp}".encode("utf-8")
    return hmac.new(
        settings.JWT_SECRET.encode("utf-8"), message, hashlib.sha256
    ).hexdigest()


def verify_otp_hash(email: str, otp: str, expected_hash: str) -> bool:
    return hmac.compare_digest(hash_otp(email, otp), expected_hash)
