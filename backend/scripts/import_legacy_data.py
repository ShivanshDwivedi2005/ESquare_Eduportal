from __future__ import annotations

from pathlib import Path

from sqlalchemy import text

from app.database import transaction

SQL = Path(__file__).resolve().parents[1] / "alembic" / "sql"


def available(connection, *tables: str) -> bool:
    return all(
        connection.execute(text("SELECT to_regclass(:name)"), {"name": name}).scalar()
        for name in tables
    )


def execute_file(connection, name: str) -> None:
    connection.exec_driver_sql((SQL / name).read_text(encoding="utf-8"))


def main() -> None:
    with transaction(platform=True) as connection:
        if not available(connection, "legacy_auth.users", "legacy_auth.password_credentials"):
            print("No preserved legacy identity tables were found; nothing to import.")
            return
        execute_file(connection, "import_identity.sql")
        if available(connection, "legacy_core.schools", "legacy_core.school_memberships"):
            execute_file(connection, "import_schools.sql")
        if available(connection, "legacy_academics.students"):
            execute_file(connection, "import_students.sql")
        counts = connection.execute(
            text("""
            SELECT (SELECT count(*) FROM users), (SELECT count(*) FROM institutions),
                   (SELECT count(*) FROM institution_memberships), (SELECT count(*) FROM students)
        """)
        ).one()
    print(
        f"Legacy import complete: {counts[0]} users, {counts[1]} institutions, {counts[2]} memberships, {counts[3]} students."
    )


if __name__ == "__main__":
    main()
