from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.common.password import hash_password
from app.modules.auth.models import OTPCode, User, PasswordCredential, GoogleAccount
from app.common.otp import generate_otp
from fastapi import HTTPException
from google.oauth2 import id_token
from google.auth.transport import requests
from app.common.email import send_email_otp
import asyncio


async def send_otp_service(email: str, db: Session):
    otp = generate_otp()

    otp_entry = OTPCode(
        email=email,
        otp=otp,
        expires_at=datetime.utcnow() + timedelta(minutes=5),
        purpose="signup"
    )

    db.add(otp_entry)
    db.commit()

    try:
        await send_email_otp(email, otp)
    except Exception:
        db.delete(otp_entry)
        db.commit()
        raise HTTPException(status_code=500, detail="Failed to send OTP email")

    return {"message": "OTP sent"}

def verify_otp_service(email: str, otp: str, db: Session):

    record = db.query(OTPCode).filter(
        OTPCode.email == email,
        OTPCode.otp == otp
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")

    return {"message": "OTP verified"}

def signup_service(email: str, password: str, db: Session):

    existing = db.query(User).filter(User.email == email).first()

    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    user = User(email=email, email_verified=True)

    db.add(user)
    db.flush()

    password_entry = PasswordCredential(
        user_id=user.id,
        password_hash=hash_password(password)
    )

    db.add(password_entry)
    db.commit()

    return {"message": "User created"}

from app.common.password import verify_password
from app.common.jwt import create_access_token

def login_service(email: str, password: str, db: Session):

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    credential = db.query(PasswordCredential).filter(
        PasswordCredential.user_id == user.id
    ).first()

    if not credential or not verify_password(password, credential.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({"user_id": str(user.id)})

    return {"access_token": token}

def google_login_service(token: str, db: Session):

    idinfo = id_token.verify_oauth2_token(token, requests.Request())

    email = idinfo["email"]
    google_sub = idinfo["sub"]

    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(email=email, email_verified=True)
        db.add(user)
        db.flush()

        db.add(GoogleAccount(user_id=user.id, google_sub=google_sub))
        db.commit()

    access_token = create_access_token({"user_id": str(user.id)})

    return {"access_token": access_token}