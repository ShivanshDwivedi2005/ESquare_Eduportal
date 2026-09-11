from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from . import (
    academics,
    audit_routes,
    auth,
    institution_requests,
    institutions,
    invitations,
    onboarding,
)
from .config import get_settings
from .database import engine
from .dependencies import rate_limiter
from .errors import ApplicationError

logger = logging.getLogger("esquare")


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield
    engine.dispose()


app = FastAPI(title="ESQUARE API", version="2.0.0", lifespan=lifespan)
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_security(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid4())
    try:
        rate_limiter.check(request, 300, 60, "global")
    except ApplicationError as error:
        return JSONResponse(
            status_code=error.status_code,
            content={
                "error": {"code": error.code, "message": error.message},
                "requestId": request_id,
            },
            headers={"x-request-id": request_id},
        )
    if request.headers.get("content-length") and int(request.headers["content-length"]) > 1_048_576:
        return JSONResponse(
            status_code=413,
            content={
                "error": {"code": "REQUEST_TOO_LARGE", "message": "Request body is too large"},
                "requestId": request_id,
            },
        )
    forwarded = request.headers.get("x-forwarded-proto") if settings.trust_proxy else None
    protocol = forwarded or request.url.scheme
    if (
        settings.environment == "production"
        and protocol != "https"
        and not request.url.path.startswith("/health/")
    ):
        response = JSONResponse(
            status_code=400,
            content={
                "error": {"code": "HTTPS_REQUIRED", "message": "HTTPS is required"},
                "requestId": request_id,
            },
        )
    else:
        request.state.request_id = request_id
        response = await call_next(request)
    response.headers["x-request-id"] = request_id
    response.headers["x-content-type-options"] = "nosniff"
    response.headers["x-frame-options"] = "DENY"
    response.headers["referrer-policy"] = "no-referrer"
    response.headers["content-security-policy"] = "default-src 'none'; frame-ancestors 'none'"
    if settings.environment == "production":
        response.headers["strict-transport-security"] = "max-age=31536000; includeSubDomains"
    return response


@app.exception_handler(ApplicationError)
async def application_error(request: Request, error: ApplicationError):
    return JSONResponse(
        status_code=error.status_code,
        content={
            "error": {
                "code": error.code,
                "message": error.message if error.expose else "The request could not be completed",
            },
            "requestId": getattr(request.state, "request_id", str(uuid4())),
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, _error: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": {"code": "VALIDATION_ERROR", "message": "Request validation failed"},
            "requestId": getattr(request.state, "request_id", str(uuid4())),
        },
    )


@app.exception_handler(IntegrityError)
async def integrity_error(request: Request, error: IntegrityError):
    sqlstate = getattr(error.orig, "sqlstate", None)
    mapping = {
        "23505": (409, "RESOURCE_CONFLICT", "A conflicting record already exists"),
        "23503": (422, "INVALID_REFERENCE", "A referenced record is invalid"),
        "40001": (409, "TRANSACTION_CONFLICT", "The request conflicted with another update"),
    }
    status_code, code, message = mapping.get(
        sqlstate, (500, "INTERNAL_ERROR", "The request could not be completed")
    )
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {"code": code, "message": message},
            "requestId": getattr(request.state, "request_id", str(uuid4())),
        },
    )


@app.exception_handler(Exception)
async def unhandled_error(request: Request, error: Exception):
    logger.exception("Unhandled request error", exc_info=error)
    message = (
        "The request could not be completed" if settings.environment == "production" else str(error)
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": {"code": "INTERNAL_ERROR", "message": message},
            "requestId": getattr(request.state, "request_id", str(uuid4())),
        },
    )


@app.get("/health/live", tags=["health"])
def live() -> dict:
    return {"status": "ok"}


@app.get("/health/ready", tags=["health"])
def ready() -> dict:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"status": "ready"}


for api_router in (
    auth.router,
    institution_requests.router,
    institutions.router,
    invitations.router,
    onboarding.router,
    academics.router,
    audit_routes.router,
):
    app.include_router(api_router)
