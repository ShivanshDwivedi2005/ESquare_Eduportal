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
      ON CONFLICT (email) DO NOTHING;

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
      ON CONFLICT (user_id) DO NOTHING;
