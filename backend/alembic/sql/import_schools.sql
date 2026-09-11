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
        ON CONFLICT (institution_code) DO NOTHING;

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
        ON CONFLICT (institution_id, user_id) DO NOTHING;

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
        ON CONFLICT (membership_id, role_id) DO NOTHING;
