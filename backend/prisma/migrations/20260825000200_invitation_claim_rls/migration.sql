-- Permit possession of a valid token digest to reveal only its invitation row.
-- Writes remain tenant-scoped and application authorization is still mandatory.
DROP POLICY IF EXISTS "invitations_tenant_isolation" ON "public"."invitations";

CREATE POLICY "invitations_tenant_isolation" ON "public"."invitations"
  USING (
    "public"."esquare_tenant_matches"(institution_id)
    OR token_hash = nullif(current_setting('app.invitation_token_hash', true), '')
  )
  WITH CHECK ("public"."esquare_tenant_matches"(institution_id));

-- PostgreSQL's default UNIQUE semantics allow repeated NULL streams.
DROP INDEX IF EXISTS "public"."class_sections_institution_id_academic_session_id_class_lev_key";
CREATE UNIQUE INDEX "class_sections_institution_id_academic_session_id_class_lev_key"
  ON "public"."class_sections"
  ("institution_id", "academic_session_id", "class_level", "section", "stream")
  NULLS NOT DISTINCT;
