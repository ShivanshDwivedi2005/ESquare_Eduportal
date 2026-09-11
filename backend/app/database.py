from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Connection, Engine

from .config import get_settings


engine: Engine = create_engine(
    get_settings().database_url,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={"connect_timeout": 10},
)


@contextmanager
def transaction(
    *,
    user_id: str | None = None,
    institution_id: str | None = None,
    platform: bool = False,
    invitation_hash: str | None = None,
    isolation_level: str = "READ COMMITTED",
) -> Iterator[Connection]:
    with engine.connect().execution_options(isolation_level=isolation_level) as connection:
        with connection.begin():
            connection.execute(
                text("""
                    SELECT set_config('app.current_user_id', :user_id, true),
                           set_config('app.current_institution_id', :institution_id, true),
                           set_config('app.platform_access', :platform, true),
                           set_config('app.invitation_token_hash', :invitation_hash, true)
                """),
                {
                    "user_id": user_id or "",
                    "institution_id": institution_id or "",
                    "platform": "true" if platform else "false",
                    "invitation_hash": invitation_hash or "",
                },
            )
            yield connection


def row(connection: Connection, sql: str, params: dict | None = None) -> dict | None:
    result = connection.execute(text(sql), params or {}).mappings().first()
    return dict(result) if result else None


def rows(connection: Connection, sql: str, params: dict | None = None) -> list[dict]:
    return [dict(item) for item in connection.execute(text(sql), params or {}).mappings()]
