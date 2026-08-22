"""Baseline the schema that existed before managed migrations.

Revision ID: 20260822_00
Revises:
Create Date: 2026-08-22
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260822_00"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS auth")
    op.execute("CREATE SCHEMA IF NOT EXISTS core")
    op.execute("CREATE SCHEMA IF NOT EXISTS academics")

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("email_verified", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        schema="auth",
    )
    op.create_index("ix_auth_users_email", "users", ["email"], schema="auth")

    op.create_table(
        "password_credentials",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["auth.users.id"]),
        sa.PrimaryKeyConstraint("user_id"),
        schema="auth",
    )
    op.create_table(
        "google_accounts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("google_sub", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["auth.users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("google_sub"),
        schema="auth",
    )
    op.create_table(
        "otp_codes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("otp", sa.String(), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("purpose", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        schema="auth",
    )
    op.create_index("ix_auth_otp_codes_email", "otp_codes", ["email"], schema="auth")

    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("role_name", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("role_name"),
        schema="core",
    )
    op.create_index("ix_core_roles_id", "roles", ["id"], schema="core")
    op.create_table(
        "schools",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("unique_code", sa.Text(), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("unique_code"),
        schema="core",
    )
    op.create_table(
        "school_registration_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("school_name", sa.Text(), nullable=False),
        sa.Column("email", sa.Text(), nullable=False),
        sa.Column("phone", sa.Text(), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("admin_name", sa.Text(), nullable=True),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("status", sa.Text(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.TIMESTAMP(), server_default=sa.text("now()"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        schema="core",
    )
    op.create_table(
        "school_memberships",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("school_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("role_id", sa.Integer(), nullable=True),
        sa.Column("status", sa.Text(), nullable=True),
        sa.Column("joined_at", sa.TIMESTAMP(), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["role_id"], ["core.roles.id"]),
        sa.ForeignKeyConstraint(["school_id"], ["core.schools.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["auth.users.id"]),
        sa.PrimaryKeyConstraint("id"),
        schema="core",
    )

    op.create_table(
        "students",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("school_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("membership_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("student_unique_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["membership_id"], ["core.school_memberships.id"]),
        sa.ForeignKeyConstraint(["school_id"], ["core.schools.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("student_unique_id"),
        schema="academics",
    )
    op.create_table(
        "student_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("school_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("first_name", sa.String(), nullable=False),
        sa.Column("last_name", sa.String(), nullable=True),
        sa.Column("dob", sa.Date(), nullable=False),
        sa.Column("gender", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("parent_name", sa.String(), nullable=True),
        sa.Column("parent_phone", sa.String(), nullable=True),
        sa.Column("address", sa.String(), nullable=True),
        sa.Column("admission_date", sa.TIMESTAMP(), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["school_id"], ["core.schools.id"]),
        sa.ForeignKeyConstraint(["student_id"], ["academics.students.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("student_id"),
        schema="academics",
    )


def downgrade() -> None:
    op.drop_table("student_profiles", schema="academics")
    op.drop_table("students", schema="academics")
    op.drop_table("school_memberships", schema="core")
    op.drop_table("school_registration_requests", schema="core")
    op.drop_table("schools", schema="core")
    op.drop_index("ix_core_roles_id", table_name="roles", schema="core")
    op.drop_table("roles", schema="core")
    op.drop_index("ix_auth_otp_codes_email", table_name="otp_codes", schema="auth")
    op.drop_table("otp_codes", schema="auth")
    op.drop_table("google_accounts", schema="auth")
    op.drop_table("password_credentials", schema="auth")
    op.drop_index("ix_auth_users_email", table_name="users", schema="auth")
    op.drop_table("users", schema="auth")
