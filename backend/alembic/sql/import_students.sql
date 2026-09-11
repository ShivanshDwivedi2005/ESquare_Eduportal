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
        ON CONFLICT (institution_id, user_id) DO NOTHING;
