-- This migration intentionally removes the legacy SQLite-era PostgreSQL layout.
-- Take a database backup before applying it to any environment containing valuable data.
DROP SCHEMA IF EXISTS "academics" CASCADE;
DROP SCHEMA IF EXISTS "core" CASCADE;
DROP SCHEMA IF EXISTS "auth" CASCADE;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BLOCKED', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."PlatformRole" AS ENUM ('PLATFORM_SUPER_ADMIN', 'PLATFORM_INSTITUTION_REVIEWER');

-- CreateEnum
CREATE TYPE "public"."InstitutionType" AS ENUM ('SCHOOL', 'COLLEGE', 'UNIVERSITY', 'COACHING', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."RegistrationRequestStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."InstitutionStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."MembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'LEFT');

-- CreateEnum
CREATE TYPE "public"."InvitationType" AS ENUM ('ADMIN', 'STUDENT', 'TEACHER', 'STAFF');

-- CreateEnum
CREATE TYPE "public"."InvitationStatus" AS ENUM ('PENDING', 'CLAIMED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "public"."PersonType" AS ENUM ('STUDENT', 'TEACHER', 'STAFF');

-- CreateEnum
CREATE TYPE "public"."OnboardingStatus" AS ENUM ('DRAFT', 'READY', 'INVITED', 'CLAIMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."EmployeeType" AS ENUM ('TEACHER', 'ADMINISTRATIVE_STAFF', 'ACCOUNTANT', 'LIBRARIAN', 'LAB_ASSISTANT', 'SUPPORT_STAFF', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."EntityStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'LEFT');

-- CreateEnum
CREATE TYPE "public"."AcademicStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."ChallengePurpose" AS ENUM ('EMAIL_VERIFICATION', 'PHONE_VERIFICATION', 'PASSWORD_RESET');

-- CreateTable
CREATE TABLE "public"."users" (
    "user_id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "phone" VARCHAR(32),
    "password_hash" TEXT NOT NULL,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "email_verified_at" TIMESTAMPTZ(6),
    "phone_verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."user_profiles" (
    "user_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "middle_name" VARCHAR(100),
    "last_name" VARCHAR(100) NOT NULL,
    "date_of_birth" DATE,
    "gender" VARCHAR(32),
    "profile_photo_file_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."platform_user_roles" (
    "user_id" UUID NOT NULL,
    "role" "public"."PlatformRole" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_user_roles_pkey" PRIMARY KEY ("user_id","role")
);

-- CreateTable
CREATE TABLE "public"."boards" (
    "board_id" UUID NOT NULL,
    "board_code" VARCHAR(50) NOT NULL,
    "display_name" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boards_pkey" PRIMARY KEY ("board_id")
);

-- CreateTable
CREATE TABLE "public"."institution_registration_requests" (
    "request_id" UUID NOT NULL,
    "submitted_by_user_id" UUID NOT NULL,
    "institution_name" VARCHAR(250) NOT NULL,
    "institution_type" "public"."InstitutionType" NOT NULL,
    "board_id" UUID,
    "registration_number" VARCHAR(100),
    "official_email" CITEXT NOT NULL,
    "official_phone" VARCHAR(32) NOT NULL,
    "address_line_1" VARCHAR(250) NOT NULL,
    "address_line_2" VARCHAR(250),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "postal_code" VARCHAR(20) NOT NULL,
    "country" VARCHAR(2) NOT NULL,
    "proof_file_id" UUID,
    "status" "public"."RegistrationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by_user_id" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "rejection_reason" VARCHAR(1000),
    "approved_institution_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "institution_registration_requests_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "public"."institutions" (
    "institution_id" UUID NOT NULL,
    "institution_code" VARCHAR(40) NOT NULL,
    "institution_name" VARCHAR(250) NOT NULL,
    "institution_type" "public"."InstitutionType" NOT NULL,
    "board_id" UUID,
    "status" "public"."InstitutionStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("institution_id")
);

-- CreateTable
CREATE TABLE "public"."institution_memberships" (
    "membership_id" UUID NOT NULL,
    "institution_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "public"."MembershipStatus" NOT NULL DEFAULT 'PENDING',
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "institution_memberships_pkey" PRIMARY KEY ("membership_id")
);

-- CreateTable
CREATE TABLE "public"."roles" (
    "role_id" UUID NOT NULL,
    "role_code" VARCHAR(50) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "public"."permissions" (
    "permission_id" UUID NOT NULL,
    "permission_code" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("permission_id")
);

-- CreateTable
CREATE TABLE "public"."role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "public"."membership_roles" (
    "membership_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_by_membership_id" UUID,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_roles_pkey" PRIMARY KEY ("membership_id","role_id")
);

-- CreateTable
CREATE TABLE "public"."invitations" (
    "invitation_id" UUID NOT NULL,
    "institution_id" UUID NOT NULL,
    "invitation_type" "public"."InvitationType" NOT NULL,
    "email" CITEXT,
    "phone" VARCHAR(32),
    "target_role_id" UUID,
    "onboarding_record_id" UUID,
    "token_hash" CHAR(64) NOT NULL,
    "status" "public"."InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "claimed_at" TIMESTAMPTZ(6),
    "claimed_by_user_id" UUID,
    "created_by_membership_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("invitation_id")
);

-- CreateTable
CREATE TABLE "public"."onboarding_records" (
    "onboarding_id" UUID NOT NULL,
    "institution_id" UUID NOT NULL,
    "person_type" "public"."PersonType" NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "middle_name" VARCHAR(100),
    "last_name" VARCHAR(100) NOT NULL,
    "email" CITEXT,
    "phone" VARCHAR(32),
    "date_of_birth" DATE,
    "status" "public"."OnboardingStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by_membership_id" UUID NOT NULL,
    "claimed_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "onboarding_records_pkey" PRIMARY KEY ("onboarding_id")
);

-- CreateTable
CREATE TABLE "public"."student_onboarding_details" (
    "onboarding_id" UUID NOT NULL,
    "institution_id" UUID NOT NULL,
    "admission_number" VARCHAR(100) NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "class_section_id" UUID NOT NULL,
    "guardian_name" VARCHAR(200),
    "guardian_phone" VARCHAR(32),
    "admission_date" DATE NOT NULL,

    CONSTRAINT "student_onboarding_details_pkey" PRIMARY KEY ("onboarding_id")
);

-- CreateTable
CREATE TABLE "public"."employee_onboarding_details" (
    "onboarding_id" UUID NOT NULL,
    "institution_id" UUID NOT NULL,
    "employee_number" VARCHAR(100) NOT NULL,
    "employee_type" "public"."EmployeeType" NOT NULL,
    "designation" VARCHAR(150),
    "department" VARCHAR(150),
    "joining_date" DATE NOT NULL,

    CONSTRAINT "employee_onboarding_details_pkey" PRIMARY KEY ("onboarding_id")
);

-- CreateTable
CREATE TABLE "public"."students" (
    "student_id" UUID NOT NULL,
    "institution_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "admission_number" VARCHAR(100) NOT NULL,
    "status" "public"."EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "public"."employees" (
    "employee_id" UUID NOT NULL,
    "institution_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "employee_number" VARCHAR(100) NOT NULL,
    "employee_type" "public"."EmployeeType" NOT NULL,
    "designation" VARCHAR(150),
    "department" VARCHAR(150),
    "status" "public"."EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("employee_id")
);

-- CreateTable
CREATE TABLE "public"."academic_sessions" (
    "academic_session_id" UUID NOT NULL,
    "institution_id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "public"."AcademicStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "academic_sessions_pkey" PRIMARY KEY ("academic_session_id")
);

-- CreateTable
CREATE TABLE "public"."class_sections" (
    "class_section_id" UUID NOT NULL,
    "institution_id" UUID NOT NULL,
    "academic_session_id" UUID NOT NULL,
    "class_level" VARCHAR(50) NOT NULL,
    "section" VARCHAR(20) NOT NULL,
    "stream" VARCHAR(100),
    "status" "public"."AcademicStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "class_sections_pkey" PRIMARY KEY ("class_section_id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "audit_id" UUID NOT NULL,
    "institution_id" UUID,
    "actor_user_id" UUID NOT NULL,
    "actor_membership_id" UUID,
    "action" VARCHAR(150) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" UUID NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "ip_address" INET,
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("audit_id")
);

-- CreateTable
CREATE TABLE "public"."refresh_sessions" (
    "session_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "replaced_by_session_id" UUID,
    "user_agent" VARCHAR(500),
    "ip_address" INET,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "public"."verification_challenges" (
    "challenge_id" UUID NOT NULL,
    "user_id" UUID,
    "email" CITEXT,
    "phone" VARCHAR(32),
    "purpose" "public"."ChallengePurpose" NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_challenges_pkey" PRIMARY KEY ("challenge_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_users_email" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "uq_users_phone" ON "public"."users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "boards_board_code_key" ON "public"."boards"("board_code");

-- CreateIndex
CREATE UNIQUE INDEX "institution_registration_requests_approved_institution_id_key" ON "public"."institution_registration_requests"("approved_institution_id");

-- CreateIndex
CREATE INDEX "institution_registration_requests_submitted_by_user_id_crea_idx" ON "public"."institution_registration_requests"("submitted_by_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "institution_registration_requests_status_created_at_idx" ON "public"."institution_registration_requests"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "institutions_institution_code_key" ON "public"."institutions"("institution_code");

-- CreateIndex
CREATE INDEX "institutions_status_idx" ON "public"."institutions"("status");

-- CreateIndex
CREATE INDEX "institution_memberships_user_id_status_idx" ON "public"."institution_memberships"("user_id", "status");

-- CreateIndex
CREATE INDEX "institution_memberships_institution_id_status_idx" ON "public"."institution_memberships"("institution_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "institution_memberships_institution_id_user_id_key" ON "public"."institution_memberships"("institution_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_code_key" ON "public"."roles"("role_code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_permission_code_key" ON "public"."permissions"("permission_code");

-- CreateIndex
CREATE INDEX "membership_roles_role_id_idx" ON "public"."membership_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_onboarding_record_id_key" ON "public"."invitations"("onboarding_record_id");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_hash_key" ON "public"."invitations"("token_hash");

-- CreateIndex
CREATE INDEX "invitations_institution_id_status_created_at_idx" ON "public"."invitations"("institution_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "invitations_email_status_idx" ON "public"."invitations"("email", "status");

-- CreateIndex
CREATE INDEX "invitations_phone_status_idx" ON "public"."invitations"("phone", "status");

-- CreateIndex
CREATE INDEX "onboarding_records_institution_id_status_created_at_idx" ON "public"."onboarding_records"("institution_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "onboarding_records_institution_id_person_type_status_idx" ON "public"."onboarding_records"("institution_id", "person_type", "status");

-- CreateIndex
CREATE INDEX "student_onboarding_details_institution_id_academic_session__idx" ON "public"."student_onboarding_details"("institution_id", "academic_session_id", "class_section_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_onboarding_details_institution_id_admission_number_key" ON "public"."student_onboarding_details"("institution_id", "admission_number");

-- CreateIndex
CREATE INDEX "employee_onboarding_details_institution_id_employee_type_idx" ON "public"."employee_onboarding_details"("institution_id", "employee_type");

-- CreateIndex
CREATE UNIQUE INDEX "employee_onboarding_details_institution_id_employee_number_key" ON "public"."employee_onboarding_details"("institution_id", "employee_number");

-- CreateIndex
CREATE INDEX "students_institution_id_status_idx" ON "public"."students"("institution_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "students_institution_id_user_id_key" ON "public"."students"("institution_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_institution_id_admission_number_key" ON "public"."students"("institution_id", "admission_number");

-- CreateIndex
CREATE INDEX "employees_institution_id_employee_type_status_idx" ON "public"."employees"("institution_id", "employee_type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "employees_institution_id_user_id_key" ON "public"."employees"("institution_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_institution_id_employee_number_key" ON "public"."employees"("institution_id", "employee_number");

-- CreateIndex
CREATE INDEX "academic_sessions_institution_id_status_idx" ON "public"."academic_sessions"("institution_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "academic_sessions_institution_id_name_key" ON "public"."academic_sessions"("institution_id", "name");

-- CreateIndex
CREATE INDEX "class_sections_institution_id_academic_session_id_status_idx" ON "public"."class_sections"("institution_id", "academic_session_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "class_sections_institution_id_academic_session_id_class_lev_key" ON "public"."class_sections"("institution_id", "academic_session_id", "class_level", "section", "stream");

-- CreateIndex
CREATE INDEX "audit_logs_institution_id_created_at_idx" ON "public"."audit_logs"("institution_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "public"."audit_logs"("actor_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "public"."audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_sessions_token_hash_key" ON "public"."refresh_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_sessions_user_id_expires_at_idx" ON "public"."refresh_sessions"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "refresh_sessions_expires_at_idx" ON "public"."refresh_sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "verification_challenges_token_hash_key" ON "public"."verification_challenges"("token_hash");

-- CreateIndex
CREATE INDEX "verification_challenges_email_purpose_created_at_idx" ON "public"."verification_challenges"("email", "purpose", "created_at" DESC);

-- CreateIndex
CREATE INDEX "verification_challenges_phone_purpose_created_at_idx" ON "public"."verification_challenges"("phone", "purpose", "created_at" DESC);

-- CreateIndex
CREATE INDEX "verification_challenges_expires_at_idx" ON "public"."verification_challenges"("expires_at");

-- AddForeignKey
ALTER TABLE "public"."user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."platform_user_roles" ADD CONSTRAINT "platform_user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."institution_registration_requests" ADD CONSTRAINT "institution_registration_requests_submitted_by_user_id_fkey" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."institution_registration_requests" ADD CONSTRAINT "institution_registration_requests_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."institution_registration_requests" ADD CONSTRAINT "institution_registration_requests_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("board_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."institution_registration_requests" ADD CONSTRAINT "institution_registration_requests_approved_institution_id_fkey" FOREIGN KEY ("approved_institution_id") REFERENCES "public"."institutions"("institution_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."institutions" ADD CONSTRAINT "institutions_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("board_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."institution_memberships" ADD CONSTRAINT "institution_memberships_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("institution_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."institution_memberships" ADD CONSTRAINT "institution_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("permission_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."membership_roles" ADD CONSTRAINT "membership_roles_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "public"."institution_memberships"("membership_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."membership_roles" ADD CONSTRAINT "membership_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."membership_roles" ADD CONSTRAINT "membership_roles_assigned_by_membership_id_fkey" FOREIGN KEY ("assigned_by_membership_id") REFERENCES "public"."institution_memberships"("membership_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invitations" ADD CONSTRAINT "invitations_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("institution_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invitations" ADD CONSTRAINT "invitations_target_role_id_fkey" FOREIGN KEY ("target_role_id") REFERENCES "public"."roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invitations" ADD CONSTRAINT "invitations_onboarding_record_id_fkey" FOREIGN KEY ("onboarding_record_id") REFERENCES "public"."onboarding_records"("onboarding_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invitations" ADD CONSTRAINT "invitations_claimed_by_user_id_fkey" FOREIGN KEY ("claimed_by_user_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invitations" ADD CONSTRAINT "invitations_created_by_membership_id_fkey" FOREIGN KEY ("created_by_membership_id") REFERENCES "public"."institution_memberships"("membership_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."onboarding_records" ADD CONSTRAINT "onboarding_records_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("institution_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."onboarding_records" ADD CONSTRAINT "onboarding_records_created_by_membership_id_fkey" FOREIGN KEY ("created_by_membership_id") REFERENCES "public"."institution_memberships"("membership_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."onboarding_records" ADD CONSTRAINT "onboarding_records_claimed_by_user_id_fkey" FOREIGN KEY ("claimed_by_user_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_onboarding_details" ADD CONSTRAINT "student_onboarding_details_onboarding_id_fkey" FOREIGN KEY ("onboarding_id") REFERENCES "public"."onboarding_records"("onboarding_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_onboarding_details" ADD CONSTRAINT "student_onboarding_details_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("institution_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_onboarding_details" ADD CONSTRAINT "student_onboarding_details_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "public"."academic_sessions"("academic_session_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_onboarding_details" ADD CONSTRAINT "student_onboarding_details_class_section_id_fkey" FOREIGN KEY ("class_section_id") REFERENCES "public"."class_sections"("class_section_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_onboarding_details" ADD CONSTRAINT "employee_onboarding_details_onboarding_id_fkey" FOREIGN KEY ("onboarding_id") REFERENCES "public"."onboarding_records"("onboarding_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_onboarding_details" ADD CONSTRAINT "employee_onboarding_details_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("institution_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."students" ADD CONSTRAINT "students_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("institution_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("institution_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."academic_sessions" ADD CONSTRAINT "academic_sessions_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("institution_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."class_sections" ADD CONSTRAINT "class_sections_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("institution_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."class_sections" ADD CONSTRAINT "class_sections_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "public"."academic_sessions"("academic_session_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("institution_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_actor_membership_id_fkey" FOREIGN KEY ("actor_membership_id") REFERENCES "public"."institution_memberships"("membership_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."refresh_sessions" ADD CONSTRAINT "refresh_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."verification_challenges" ADD CONSTRAINT "verification_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Security and data-integrity checks not expressible in the Prisma schema.
ALTER TABLE "public"."users"
  ADD CONSTRAINT "ck_users_email_trimmed" CHECK (email = btrim(email::text)),
  ADD CONSTRAINT "ck_users_phone_e164" CHECK (phone IS NULL OR phone ~ '^\+[1-9][0-9]{7,14}$');

ALTER TABLE "public"."institution_registration_requests"
  ADD CONSTRAINT "ck_registration_country_iso2" CHECK (country ~ '^[A-Z]{2}$'),
  ADD CONSTRAINT "ck_registration_review_state" CHECK (
    (status IN ('PENDING', 'CANCELLED') AND reviewed_by_user_id IS NULL AND reviewed_at IS NULL)
    OR (status = 'UNDER_REVIEW' AND reviewed_by_user_id IS NOT NULL)
    OR (status IN ('APPROVED', 'REJECTED') AND reviewed_by_user_id IS NOT NULL AND reviewed_at IS NOT NULL)
  ),
  ADD CONSTRAINT "ck_registration_approval_target" CHECK (
    (status = 'APPROVED' AND approved_institution_id IS NOT NULL AND rejection_reason IS NULL)
    OR (status <> 'APPROVED' AND approved_institution_id IS NULL)
  ),
  ADD CONSTRAINT "ck_registration_rejection_reason" CHECK (
    status <> 'REJECTED' OR rejection_reason IS NOT NULL
  );

ALTER TABLE "public"."institution_memberships"
  ADD CONSTRAINT "ck_membership_left_at" CHECK (
    (status = 'LEFT' AND left_at IS NOT NULL) OR (status <> 'LEFT' AND left_at IS NULL)
  );

ALTER TABLE "public"."invitations"
  ADD CONSTRAINT "ck_invitation_recipient" CHECK (num_nonnulls(email, phone) = 1),
  ADD CONSTRAINT "ck_invitation_claim_state" CHECK (
    (status = 'CLAIMED' AND claimed_at IS NOT NULL AND claimed_by_user_id IS NOT NULL)
    OR (status <> 'CLAIMED' AND claimed_at IS NULL AND claimed_by_user_id IS NULL)
  );

ALTER TABLE "public"."onboarding_records"
  ADD CONSTRAINT "ck_onboarding_recipient" CHECK (num_nonnulls(email, phone) >= 1),
  ADD CONSTRAINT "ck_onboarding_claimant" CHECK (
    (status = 'CLAIMED' AND claimed_by_user_id IS NOT NULL)
    OR (status <> 'CLAIMED' AND claimed_by_user_id IS NULL)
  );

ALTER TABLE "public"."academic_sessions"
  ADD CONSTRAINT "ck_academic_session_dates" CHECK (end_date > start_date);

ALTER TABLE "public"."verification_challenges"
  ADD CONSTRAINT "ck_challenge_recipient" CHECK (num_nonnulls(email, phone) = 1),
  ADD CONSTRAINT "ck_challenge_attempts" CHECK (attempts BETWEEN 0 AND 10);

-- Composite references prevent a valid identifier from another tenant being attached.
CREATE UNIQUE INDEX "uq_academic_sessions_id_tenant"
  ON "public"."academic_sessions" ("academic_session_id", "institution_id");
CREATE UNIQUE INDEX "uq_class_sections_id_tenant"
  ON "public"."class_sections" ("class_section_id", "institution_id");
CREATE UNIQUE INDEX "uq_onboarding_records_id_tenant"
  ON "public"."onboarding_records" ("onboarding_id", "institution_id");

ALTER TABLE "public"."student_onboarding_details"
  ADD CONSTRAINT "student_onboarding_tenant_fkey"
    FOREIGN KEY ("onboarding_id", "institution_id")
    REFERENCES "public"."onboarding_records" ("onboarding_id", "institution_id") ON DELETE CASCADE,
  ADD CONSTRAINT "student_onboarding_session_tenant_fkey"
    FOREIGN KEY ("academic_session_id", "institution_id")
    REFERENCES "public"."academic_sessions" ("academic_session_id", "institution_id") ON DELETE RESTRICT,
  ADD CONSTRAINT "student_onboarding_class_tenant_fkey"
    FOREIGN KEY ("class_section_id", "institution_id")
    REFERENCES "public"."class_sections" ("class_section_id", "institution_id") ON DELETE RESTRICT;

ALTER TABLE "public"."employee_onboarding_details"
  ADD CONSTRAINT "employee_onboarding_tenant_fkey"
    FOREIGN KEY ("onboarding_id", "institution_id")
    REFERENCES "public"."onboarding_records" ("onboarding_id", "institution_id") ON DELETE CASCADE;

-- RLS is defense-in-depth. The API still performs membership and permission checks.
CREATE OR REPLACE FUNCTION "public"."esquare_tenant_matches"(row_institution_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
  SELECT current_setting('app.platform_access', true) = 'true'
    OR row_institution_id = nullif(current_setting('app.current_institution_id', true), '')::uuid
$$;

ALTER TABLE "public"."institutions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "institutions_tenant_isolation" ON "public"."institutions"
  USING ("public"."esquare_tenant_matches"(institution_id))
  WITH CHECK ("public"."esquare_tenant_matches"(institution_id));

ALTER TABLE "public"."institution_memberships" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "memberships_tenant_isolation" ON "public"."institution_memberships"
  USING (
    "public"."esquare_tenant_matches"(institution_id)
    OR user_id = nullif(current_setting('app.current_user_id', true), '')::uuid
  )
  WITH CHECK ("public"."esquare_tenant_matches"(institution_id));

ALTER TABLE "public"."invitations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invitations_tenant_isolation" ON "public"."invitations"
  USING ("public"."esquare_tenant_matches"(institution_id))
  WITH CHECK ("public"."esquare_tenant_matches"(institution_id));

ALTER TABLE "public"."onboarding_records" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "onboarding_records_tenant_isolation" ON "public"."onboarding_records"
  USING ("public"."esquare_tenant_matches"(institution_id))
  WITH CHECK ("public"."esquare_tenant_matches"(institution_id));

ALTER TABLE "public"."student_onboarding_details" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_onboarding_tenant_isolation" ON "public"."student_onboarding_details"
  USING ("public"."esquare_tenant_matches"(institution_id))
  WITH CHECK ("public"."esquare_tenant_matches"(institution_id));

ALTER TABLE "public"."employee_onboarding_details" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employee_onboarding_tenant_isolation" ON "public"."employee_onboarding_details"
  USING ("public"."esquare_tenant_matches"(institution_id))
  WITH CHECK ("public"."esquare_tenant_matches"(institution_id));

ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students_tenant_isolation" ON "public"."students"
  USING ("public"."esquare_tenant_matches"(institution_id))
  WITH CHECK ("public"."esquare_tenant_matches"(institution_id));

ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employees_tenant_isolation" ON "public"."employees"
  USING ("public"."esquare_tenant_matches"(institution_id))
  WITH CHECK ("public"."esquare_tenant_matches"(institution_id));

ALTER TABLE "public"."academic_sessions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "academic_sessions_tenant_isolation" ON "public"."academic_sessions"
  USING ("public"."esquare_tenant_matches"(institution_id))
  WITH CHECK ("public"."esquare_tenant_matches"(institution_id));

ALTER TABLE "public"."class_sections" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "class_sections_tenant_isolation" ON "public"."class_sections"
  USING ("public"."esquare_tenant_matches"(institution_id))
  WITH CHECK ("public"."esquare_tenant_matches"(institution_id));

ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_tenant_isolation" ON "public"."audit_logs"
  USING (institution_id IS NULL OR "public"."esquare_tenant_matches"(institution_id))
  WITH CHECK (institution_id IS NULL OR "public"."esquare_tenant_matches"(institution_id));
