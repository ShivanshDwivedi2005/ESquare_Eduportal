import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApplication } from "../src/app.js";

let application: FastifyInstance;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = "postgresql://user:password@localhost:5432/esquare";
  process.env.DIRECT_DATABASE_URL = process.env.DATABASE_URL;
  process.env.JWT_ACCESS_SECRET = "access-secret-that-is-longer-than-thirty-two-characters";
  process.env.JWT_REFRESH_SECRET = "refresh-secret-that-is-longer-than-thirty-two-characters";
  process.env.CORS_ORIGINS = "http://localhost:5173";
  process.env.APP_BASE_URL = "http://localhost:5173";
  application = await buildApplication();
}, 30_000);

afterAll(async () => {
  if (application) await application.close();
});

describe("HTTP security boundary", () => {
  it("adds security headers and request IDs", async () => {
    const response = await application.inject({ method: "GET", url: "/health/live" });
    expect(response.statusCode).toBe(200);
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(response.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("rejects cookie-authenticated mutations without an allowlisted Origin", async () => {
    const response = await application.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      cookies: { esquare_refresh: "opaque-token" },
    });
    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe("UNTRUSTED_ORIGIN");
  });

  it("rejects role injection before reaching business logic", async () => {
    const response = await application.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: "aditi@example.com",
        password: "SecurePassword123",
        firstName: "Aditi",
        lastName: "Sharma",
        role: "ROOT_ADMIN",
      },
    });
    expect(response.statusCode).toBe(422);
    expect(response.json().error.code).toBe("VALIDATION_ERROR");
  });
});
