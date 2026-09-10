import { PrismaClient } from "@prisma/client";

import { loadProjectEnvironment } from "../src/config/bootstrap-environment.js";

loadProjectEnvironment();

const database = new PrismaClient();

async function legacySchemaIsAvailable(): Promise<boolean> {
  const rows = await database.$queryRaw<Array<{ available: boolean }>>`
    SELECT to_regclass('legacy_auth.users') IS NOT NULL
       AND to_regclass('legacy_auth.password_credentials') IS NOT NULL AS available
  `;
  return rows[0]?.available ?? false;
}

async function main(): Promise<void> {
  if (!(await legacySchemaIsAvailable())) {
    console.log("No preserved legacy identity tables were found; nothing to import.");
    return;
  }

  await database.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe(`
      INSERT INTO public.users (
        user_id, email, phone, password_hash, status,
        email_verified_at, phone_verified_at, created_at, updated_at
      )
      SELECT
        u.id,
        lower(btrim(u.email)),
        NULL,
        credentials.password_hash,
        CASE upper(coalesce(u.status, 'ACTIVE'))
          WHEN 'SUSPENDED' THEN 'SUSPENDED'::public."UserStatus"
          WHEN 'BLOCKED' THEN 'BLOCKED'::public."UserStatus"
          WHEN 'DELETED' THEN 'DELETED'::public."UserStatus"
          ELSE 'ACTIVE'::public."UserStatus"
        END,
        CASE WHEN u.email_verified THEN u.created_at ELSE NULL END,
        NULL,
        u.created_at,
        u.created_at
      FROM legacy_auth.users AS u
      INNER JOIN legacy_auth.password_credentials AS credentials
        ON credentials.user_id = u.id
      ON CONFLICT (email) DO NOTHING
    `);

    await transaction.$executeRawUnsafe(`
      INSERT INTO public.user_profiles (
        user_id, first_name, middle_name, last_name,
        date_of_birth, gender, profile_photo_file_id, created_at, updated_at
      )
      SELECT
        u.id,
        coalesce(
          nullif(split_part(btrim(u.display_name), ' ', 1), ''),
          nullif(btrim(u.username), ''),
          'User'
        ),
        NULL,
        CASE
          WHEN strpos(btrim(u.display_name), ' ') > 0
            THEN nullif(btrim(substr(btrim(u.display_name), strpos(btrim(u.display_name), ' ') + 1)), '')
          ELSE 'Account'
        END,
        NULL,
        NULL,
        NULL,
        u.created_at,
        u.created_at
      FROM legacy_auth.users AS u
      INNER JOIN public.users AS imported_user ON imported_user.user_id = u.id
      ON CONFLICT (user_id) DO NOTHING
    `);

    if ((await transaction.$queryRaw<Array<{ available: boolean }>>`
      SELECT to_regclass('legacy_core.schools') IS NOT NULL
         AND to_regclass('legacy_core.school_memberships') IS NOT NULL AS available
    `)[0]?.available) {
      await transaction.$executeRawUnsafe(`
        INSERT INTO public.institutions (
          institution_id, institution_code, institution_name,
          institution_type, board_id, status, created_at, updated_at
        )
        SELECT
          school.id,
          btrim(school.unique_code),
          btrim(school.name),
          'SCHOOL'::public."InstitutionType",
          NULL,
          CASE upper(coalesce(school.status, 'ACTIVE'))
            WHEN 'SUSPENDED' THEN 'SUSPENDED'::public."InstitutionStatus"
            WHEN 'CLOSED' THEN 'CLOSED'::public."InstitutionStatus"
            ELSE 'ACTIVE'::public."InstitutionStatus"
          END,
          coalesce(school.created_at, now()),
          coalesce(school.created_at, now())
        FROM legacy_core.schools AS school
        ON CONFLICT (institution_code) DO NOTHING
      `);

      await transaction.$executeRawUnsafe(`
        INSERT INTO public.institution_memberships (
          membership_id, institution_id, user_id, status,
          joined_at, left_at, created_at, updated_at
        )
        SELECT
          membership.id,
          membership.school_id,
          membership.user_id,
          CASE upper(coalesce(membership.status, 'ACTIVE'))
            WHEN 'PENDING' THEN 'PENDING'::public."MembershipStatus"
            WHEN 'SUSPENDED' THEN 'SUSPENDED'::public."MembershipStatus"
            WHEN 'LEFT' THEN 'LEFT'::public."MembershipStatus"
            ELSE 'ACTIVE'::public."MembershipStatus"
          END,
          coalesce(membership.joined_at, now()),
          CASE WHEN upper(coalesce(membership.status, 'ACTIVE')) = 'LEFT'
            THEN coalesce(membership.joined_at, now()) ELSE NULL END,
          coalesce(membership.joined_at, now()),
          coalesce(membership.joined_at, now())
        FROM legacy_core.school_memberships AS membership
        INNER JOIN public.users AS imported_user ON imported_user.user_id = membership.user_id
        INNER JOIN public.institutions AS institution ON institution.institution_id = membership.school_id
        ON CONFLICT (institution_id, user_id) DO NOTHING
      `);

      await transaction.$executeRawUnsafe(`
        INSERT INTO public.membership_roles (
          membership_id, role_id, assigned_by_membership_id, assigned_at
        )
        SELECT
          membership.id,
          role.role_id,
          NULL,
          coalesce(membership.joined_at, now())
        FROM legacy_core.school_memberships AS membership
        INNER JOIN legacy_core.roles AS legacy_role ON legacy_role.id = membership.role_id
        INNER JOIN public.roles AS role ON role.role_code = CASE lower(legacy_role.role_name)
          WHEN 'school_admin' THEN 'ROOT_ADMIN'
          WHEN 'department_admin' THEN 'STAFF'
          WHEN 'principal' THEN 'PRINCIPAL'
          WHEN 'teacher' THEN 'TEACHER'
          WHEN 'student' THEN 'STUDENT'
        END
        INNER JOIN public.institution_memberships AS current_membership
          ON current_membership.membership_id = membership.id
        ON CONFLICT (membership_id, role_id) DO NOTHING
      `);
    }

    if ((await transaction.$queryRaw<Array<{ available: boolean }>>`
      SELECT to_regclass('legacy_academics.students') IS NOT NULL AS available
    `)[0]?.available) {
      await transaction.$executeRawUnsafe(`
        INSERT INTO public.students (
          student_id, institution_id, user_id, admission_number,
          status, created_at, updated_at
        )
        SELECT
          student.id,
          student.school_id,
          membership.user_id,
          coalesce(nullif(btrim(student.student_unique_id), ''), nullif(btrim(student.roll_number), ''), student.id::text),
          'ACTIVE'::public."EntityStatus",
          coalesce(student.created_at, now()),
          coalesce(student.created_at, now())
        FROM legacy_academics.students AS student
        INNER JOIN legacy_core.school_memberships AS membership
          ON membership.id = student.membership_id
        INNER JOIN public.users AS imported_user ON imported_user.user_id = membership.user_id
        INNER JOIN public.institutions AS institution ON institution.institution_id = student.school_id
        ON CONFLICT (institution_id, user_id) DO NOTHING
      `);
    }
  }, { timeout: 30_000 });

  const [users, institutions, memberships, students] = await Promise.all([
    database.user.count(),
    database.institution.count(),
    database.institutionMembership.count(),
    database.student.count(),
  ]);
  console.log(
    `Legacy import complete: ${users} users, ${institutions} institutions, ${memberships} memberships, ${students} students.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await database.$disconnect();
  });
