ALTER TABLE "public"."users"
  ALTER COLUMN "password_hash" DROP NOT NULL;

CREATE TABLE "public"."external_identities" (
  "provider" VARCHAR(32) NOT NULL,
  "provider_subject" VARCHAR(255) NOT NULL,
  "user_id" UUID NOT NULL,
  "email" CITEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "external_identities_pkey" PRIMARY KEY ("provider", "provider_subject")
);

CREATE UNIQUE INDEX "external_identities_provider_user_id_key"
  ON "public"."external_identities"("provider", "user_id");
CREATE INDEX "external_identities_user_id_idx"
  ON "public"."external_identities"("user_id");

ALTER TABLE "public"."external_identities"
  ADD CONSTRAINT "external_identities_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id")
  ON DELETE CASCADE ON UPDATE CASCADE;
