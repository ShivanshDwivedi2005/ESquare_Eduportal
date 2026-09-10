import { describe, expect, it } from "vitest";

import { normalizeProjectEnvironment } from "../src/config/bootstrap-environment.js";

describe("global environment compatibility", () => {
  it("maps the legacy root variables required by the current backend", () => {
    const normalized = normalizeProjectEnvironment({
      DATABASE_URL:
        "postgresql://user:password@example-pooler.test/app?sslmode=require",
      JWT_SECRET: "legacy-project-secret",
      JWT_EXPIRE_MINUTES: "20",
      SMTP_EMAIL: "mailer@example.com",
      SMTP_PASSWORD: "app-password",
    });

    expect(normalized.DATABASE_URL).toContain("schema=public");
    expect(normalized.DIRECT_DATABASE_URL).toContain("example.test");
    expect(normalized.DIRECT_DATABASE_URL).not.toContain("-pooler.");
    expect(normalized.JWT_ACCESS_SECRET).toHaveLength(64);
    expect(normalized.JWT_REFRESH_SECRET).toHaveLength(64);
    expect(normalized.JWT_ACCESS_SECRET).not.toBe(normalized.JWT_REFRESH_SECRET);
    expect(normalized.ACCESS_TOKEN_TTL_MINUTES).toBe("20");
    expect(normalized.SMTP_HOST).toBe("smtp.gmail.com");
    expect(normalized.SMTP_USER).toBe("mailer@example.com");
    expect(normalized.SMTP_FROM).toBe("mailer@example.com");
    expect(normalized.CORS_ORIGINS).toContain("http://localhost:8080");
    expect(normalized.APP_BASE_URL).toBe("http://localhost:8080");
  });

  it("preserves explicitly supplied current configuration", () => {
    const normalized = normalizeProjectEnvironment({
      DATABASE_URL: "postgresql://user:password@example.test/app?schema=custom",
      DIRECT_DATABASE_URL:
        "postgresql://user:password@direct.example.test/app?schema=custom",
      JWT_SECRET: "legacy-project-secret",
      JWT_ACCESS_SECRET: "a".repeat(40),
      JWT_REFRESH_SECRET: "b".repeat(40),
      SMTP_EMAIL: "legacy@example.com",
      SMTP_USER: "current@example.com",
      SMTP_FROM: "sender@example.com",
      SMTP_HOST: "mail.example.com",
    });

    expect(normalized.DATABASE_URL).toContain("schema=custom");
    expect(normalized.DIRECT_DATABASE_URL).toContain("direct.example.test");
    expect(normalized.JWT_ACCESS_SECRET).toBe("a".repeat(40));
    expect(normalized.JWT_REFRESH_SECRET).toBe("b".repeat(40));
    expect(normalized.SMTP_HOST).toBe("mail.example.com");
    expect(normalized.SMTP_USER).toBe("current@example.com");
    expect(normalized.SMTP_FROM).toBe("sender@example.com");
  });
});
