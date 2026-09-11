from __future__ import annotations

import smtplib
from email.message import EmailMessage
from urllib.parse import quote

from .config import get_settings
from .errors import ApplicationError


def _send(to: str, subject: str, body: str) -> None:
    settings = get_settings()
    if not all(
        (settings.smtp_host, settings.smtp_user, settings.smtp_password, settings.smtp_from)
    ):
        raise ApplicationError(503, "EMAIL_UNAVAILABLE", "Email delivery is not configured")
    message = EmailMessage()
    message["From"] = settings.smtp_from
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)
    if settings.smtp_port == 465:
        with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=20) as client:
            client.login(settings.smtp_user, settings.smtp_password)
            client.send_message(message)
    else:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as client:
            client.starttls()
            client.login(settings.smtp_user, settings.smtp_password)
            client.send_message(message)


def send_verification(email: str, code: str) -> None:
    _send(
        email,
        "Verify your ESQUARE account",
        f"Your ESQUARE verification code is {code}. It expires soon and can be used only once.",
    )


def send_password_reset(email: str, token: str) -> None:
    url = f"{str(get_settings().app_base_url).rstrip('/')}/reset-password?t={quote(token)}"
    _send(
        email,
        "Reset your ESQUARE password",
        f"Open this one-time link to reset your ESQUARE password: {url}",
    )


def send_invitation(email: str, token: str, institution_name: str, invitation_type: str) -> None:
    url = f"{str(get_settings().app_base_url).rstrip('/')}/join?t={quote(token)}"
    _send(
        email,
        f"Join {institution_name} on ESQUARE",
        f"{institution_name} invited you as {invitation_type.lower()}. Open this single-use link before it expires: {url}",
    )
