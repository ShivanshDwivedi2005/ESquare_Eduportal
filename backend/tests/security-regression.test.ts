import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { environmentSchema, validateEnvironment } from "../src/config/env.js";
import { auditListQuerySchema } from "../src/modules/audit/audit.schemas.js";

const backendRoot = fileURLToPath(new URL("../", import.meta.url));

function read(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

const productionEnvironment = {
  NODE_ENV: "production",
  APP_ENV: "production",
  DATABASE_URL: "postgresql://app:secret@db.example.test/esquare?sslmode=require",
  DIRECT_DATABASE_URL: "postgresql://owner:secret@db.example.test/esquare?sslmode=require",
  JWT_ACCESS_SECRET: "access-secret-that-is-at-least-thirty-two-characters",
  JWT_REFRESH_SECRET: "refresh-secret-that-is-at-least-thirty-two-characters",
  CORS_ORIGINS: "https://app.example.test",
  COOKIE_SECURE: "true",
  APP_BASE_URL: "https://app.example.test",
};

describe("production environment validation", () => {
  it("accepts TLS PostgreSQL configuration with secure browser settings", () => {
    expect(validateEnvironment(productionEnvironment)).toMatchObject({
      NODE_ENV: "production",
      COOKIE_SECURE: true,
    });
  });

  it.each([
    [{ COOKIE_SECURE: "false" }, "COOKIE_SECURE"],
    [{ CORS_ORIGINS: "*" }, "CORS_ORIGINS"],
    [{ APP_BASE_URL: "http://app.example.test" }, "APP_BASE_URL"],
    [{ DATABASE_URL: "postgresql://app:secret@db.example.test/esquare" }, "DATABASE_URL"],
    [{ DIRECT_DATABASE_URL: undefined }, "DIRECT_DATABASE_URL"],
    [{ JWT_REFRESH_SECRET: productionEnvironment.JWT_ACCESS_SECRET }, "JWT_REFRESH_SECRET"],
  ])("rejects unsafe production configuration affecting %s", (override, expectedPath) => {
    const result = environmentSchema.safeParse({ ...productionEnvironment, ...override });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => String(issue.path[0]))).toContain(expectedPath);
    }
  });
});

describe("query and migration security regressions", () => {
  it("rejects arbitrary audit sorting and unknown query keys", () => {
    expect(auditListQuerySchema.safeParse({ sort: "createdAt; DROP TABLE audit_logs" }).success).toBe(false);
    expect(auditListQuerySchema.safeParse({ includeSecrets: "true" }).success).toBe(false);
  });

  it("keeps raw SQL interpolation APIs out of application source", () => {
    const sourceFiles = [
      "../src/database/authorized-transaction.ts",
      "../src/modules/institution-requests/institution-request.service.ts",
      "../src/modules/invitations/invitation.service.ts",
    ];
    for (const sourceFile of sourceFiles) {
      expect(read(sourceFile)).not.toMatch(/\$(?:queryRawUnsafe|executeRawUnsafe)\b/);
    }
    expect(backendRoot).toContain("backend");
  });

  it("retains tenant RLS and one-claim invitation protections in migrations", () => {
    const initial = read("../prisma/migrations/20260825000100_secure_multi_tenant_foundation/migration.sql");
    const invitation = read("../prisma/migrations/20260825000200_invitation_claim_rls/migration.sql");
    expect(initial).toContain("ENABLE ROW LEVEL SECURITY");
    expect(initial).toContain("current_setting('app.current_institution_id'");
    expect(invitation).toContain("app.invitation_token_hash");
    expect(invitation).toContain("NULLS NOT DISTINCT");
  });
});
