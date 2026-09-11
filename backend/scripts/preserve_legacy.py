from pathlib import Path

from app.database import transaction


def main() -> None:
    sql = Path(__file__).resolve().parents[1] / "alembic" / "sql" / "preserve_legacy.sql"
    with transaction(platform=True) as connection:
        connection.exec_driver_sql(sql.read_text(encoding="utf-8"))
    print("Legacy schemas and tables were preserved.")


if __name__ == "__main__":
    main()
