"""Add universal user identity and refresh sessions.

Revision ID: 20260822_01
Revises:
Create Date: 2026-08-22
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260822_01"
down_revision = "20260822_00"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS auth")

    op.add_column(
        "users", sa.Column("username", sa.String(length=50), nullable=True), schema="auth"
    )
    op.add_column(
        "users", sa.Column("display_name", sa.String(length=100), nullable=True), schema="auth"
    )
    op.execute(
        """
        UPDATE auth.users
        SET username = 'user_' || substring(replace(id::text, '-', '') from 1 for 12),
            display_name = split_part(email, '@', 1),
            email_verified = coalesce(email_verified, false),
            created_at = coalesce(created_at, now())
        WHERE username IS NULL
           OR display_name IS NULL
           OR email_verified IS NULL
           OR created_at IS NULL
        """
    )
    op.alter_column("users", "username", nullable=False, schema="auth")
    op.alter_column("users", "display_name", nullable=False, schema="auth")
    op.alter_column("users", "email_verified", nullable=False, schema="auth")
    op.alter_column("users", "created_at", nullable=False, schema="auth")
    op.create_check_constraint(
        "ck_users_username_length",
        "users",
        "char_length(username) BETWEEN 3 AND 50",
        schema="auth",
    )
    op.create_check_constraint(
        "ck_users_username_format",
        "users",
        "username = lower(username) AND "
        "username ~ '^[a-z0-9_](?:[a-z0-9_.]*[a-z0-9_])?$'",
        schema="auth",
    )
    op.create_index("uq_users_username", "users", ["username"], unique=True, schema="auth")

    # Existing codes cannot be migrated safely because they were stored in plaintext.
    op.execute("DELETE FROM auth.otp_codes")
    op.add_column(
        "otp_codes", sa.Column("otp_hash", sa.String(length=64), nullable=True), schema="auth"
    )
    op.add_column(
        "otp_codes",
        sa.Column("attempts", sa.Integer(), server_default="0", nullable=False),
        schema="auth",
    )
    op.add_column(
        "otp_codes", sa.Column("consumed_at", sa.DateTime(), nullable=True), schema="auth"
    )
    op.add_column(
        "otp_codes",
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        schema="auth",
    )
    op.drop_column("otp_codes", "otp", schema="auth")
    op.alter_column("otp_codes", "email", nullable=False, schema="auth")
    op.alter_column("otp_codes", "expires_at", nullable=False, schema="auth")
    op.alter_column("otp_codes", "purpose", nullable=False, schema="auth")
    op.alter_column("otp_codes", "otp_hash", nullable=False, schema="auth")

    op.create_table(
        "refresh_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("revoked_at", sa.DateTime(), nullable=True),
        sa.Column("replaced_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("user_agent", sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["auth.users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        schema="auth",
    )
    op.create_index(
        "ix_refresh_sessions_token_hash",
        "refresh_sessions",
        ["token_hash"],
        unique=True,
        schema="auth",
    )
    op.create_index(
        "ix_refresh_sessions_user_id",
        "refresh_sessions",
        ["user_id"],
        schema="auth",
    )
    op.create_index(
        "ix_refresh_sessions_expires_at",
        "refresh_sessions",
        ["expires_at"],
        schema="auth",
    )


def downgrade() -> None:
    op.drop_index("ix_refresh_sessions_expires_at", table_name="refresh_sessions", schema="auth")
    op.drop_index("ix_refresh_sessions_user_id", table_name="refresh_sessions", schema="auth")
    op.drop_index("ix_refresh_sessions_token_hash", table_name="refresh_sessions", schema="auth")
    op.drop_table("refresh_sessions", schema="auth")

    op.add_column("otp_codes", sa.Column("otp", sa.String(), nullable=True), schema="auth")
    op.alter_column("otp_codes", "purpose", nullable=True, schema="auth")
    op.alter_column("otp_codes", "expires_at", nullable=True, schema="auth")
    op.alter_column("otp_codes", "email", nullable=True, schema="auth")
    op.drop_column("otp_codes", "created_at", schema="auth")
    op.drop_column("otp_codes", "consumed_at", schema="auth")
    op.drop_column("otp_codes", "attempts", schema="auth")
    op.drop_column("otp_codes", "otp_hash", schema="auth")

    op.drop_index("uq_users_username", table_name="users", schema="auth")
    op.drop_constraint("ck_users_username_format", "users", schema="auth", type_="check")
    op.drop_constraint("ck_users_username_length", "users", schema="auth", type_="check")
    op.alter_column("users", "created_at", nullable=True, schema="auth")
    op.alter_column("users", "email_verified", nullable=True, schema="auth")
    op.drop_column("users", "display_name", schema="auth")
    op.drop_column("users", "username", schema="auth")
