BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth')
     AND EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'legacy_auth') THEN
    RAISE EXCEPTION 'Both auth and legacy_auth exist; refusing an ambiguous rename';
  ELSIF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    ALTER SCHEMA auth RENAME TO legacy_auth;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'core')
     AND EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'legacy_core') THEN
    RAISE EXCEPTION 'Both core and legacy_core exist; refusing an ambiguous rename';
  ELSIF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'core') THEN
    ALTER SCHEMA core RENAME TO legacy_core;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'academics')
     AND EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'legacy_academics') THEN
    RAISE EXCEPTION 'Both academics and legacy_academics exist; refusing an ambiguous rename';
  ELSIF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'academics') THEN
    ALTER SCHEMA academics RENAME TO legacy_academics;
  END IF;

  IF to_regclass('public.boards') IS NOT NULL
     AND to_regclass('public.legacy_project_boards') IS NOT NULL THEN
    RAISE EXCEPTION 'Both public.boards and public.legacy_project_boards exist; refusing an ambiguous rename';
  ELSIF to_regclass('public.boards') IS NOT NULL THEN
    ALTER TABLE public.boards RENAME TO legacy_project_boards;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.legacy_project_boards'::regclass
      AND conname = 'boards_pkey'
  ) THEN
    ALTER TABLE public.legacy_project_boards
      RENAME CONSTRAINT boards_pkey TO legacy_project_boards_pkey;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.legacy_project_boards'::regclass
      AND conname = 'boards_workspace_id_fkey'
  ) THEN
    ALTER TABLE public.legacy_project_boards
      RENAME CONSTRAINT boards_workspace_id_fkey TO legacy_project_boards_workspace_id_fkey;
  END IF;
END
$$;

COMMIT;
