"""Allow shared emails and multi-account Google sign-in.

Revision ID: 20260823_02
Revises: 20260822_01
Create Date: 2026-08-23
"""

from alembic import op


revision = "20260823_02"
down_revision = "20260822_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint("users_email_key", "users", schema="auth", type_="unique")
    op.drop_constraint(
        "google_accounts_google_sub_key",
        "google_accounts",
        schema="auth",
        type_="unique",
    )
    op.alter_column(
        "google_accounts",
        "user_id",
        nullable=False,
        schema="auth",
    )
    op.alter_column(
        "google_accounts",
        "google_sub",
        nullable=False,
        schema="auth",
    )
    op.create_index(
        "ix_google_accounts_google_sub",
        "google_accounts",
        ["google_sub"],
        schema="auth",
    )
    op.create_unique_constraint(
        "uq_google_accounts_user_sub",
        "google_accounts",
        ["user_id", "google_sub"],
        schema="auth",
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_google_accounts_user_sub",
        "google_accounts",
        schema="auth",
        type_="unique",
    )
    op.drop_index(
        "ix_google_accounts_google_sub",
        table_name="google_accounts",
        schema="auth",
    )
    op.alter_column(
        "google_accounts",
        "google_sub",
        nullable=True,
        schema="auth",
    )
    op.alter_column(
        "google_accounts",
        "user_id",
        nullable=True,
        schema="auth",
    )
    op.create_unique_constraint(
        "google_accounts_google_sub_key",
        "google_accounts",
        ["google_sub"],
        schema="auth",
    )
    op.create_unique_constraint(
        "users_email_key",
        "users",
        ["email"],
        schema="auth",
    )
