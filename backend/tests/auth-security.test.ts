import { beforeAll, describe, expect, it } from "vitest";

import { createAccessToken, verifyAccessToken } from "../src/security/access-token.js";
import {
  generateOpaqueToken,
  sha256,
  verificationCodeDigest,
} from "../src/security/crypto.js";
import { hashPassword, verifyPassword } from "../src/security/password.js";
import { loginSchema, registerSchema } from "../src/modules/auth/auth.schemas.js";

beforeAll(() => {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = "postgresql://user:password@localhost:5432/esquare";
  process.env.DIRECT_DATABASE_URL = process.env.DATABASE_URL;
  process.env.JWT_ACCESS_SECRET = "access-secret-that-is-longer-than-thirty-two-characters";
  process.env.JWT_REFRESH_SECRET = "refresh-secret-that-is-longer-than-thirty-two-characters";
  process.env.CORS_ORIGINS = "http://localhost:5173";
  process.env.APP_BASE_URL = "http://localhost:5173";
});

describe("authentication security primitives", () => {
  it("hashes passwords with Argon2id and never returns plaintext", async () => {
    const password = "SecurePassword123";
    const digest = await hashPassword(password);
    expect(digest).toContain("$argon2id$");
    expect(digest).not.toContain(password);
    await expect(verifyPassword(digest, password)).resolves.toBe(true);
    await expect(verifyPassword(digest, "WrongPassword123")).resolves.toBe(false);
  });

  it("binds verification codes to both recipient and server secret", () => {
    const digest = verificationCodeDigest("a@example.com", "123456", "secret-a");
    expect(digest).not.toBe(
      verificationCodeDigest("b@example.com", "123456", "secret-a"),
    );
    expect(digest).not.toBe(
      verificationCodeDigest("a@example.com", "654321", "secret-a"),
    );
    expect(digest).not.toBe(
      verificationCodeDigest("a@example.com", "123456", "secret-b"),
    );
  });

  it("generates distinct opaque tokens and stores only deterministic digests", () => {
    const first = generateOpaqueToken();
    const second = generateOpaqueToken();
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(40);
    expect(sha256(first)).toMatch(/^[a-f0-9]{64}$/);
  });

  it("issues scoped access tokens and rejects tampering", async () => {
    const userId = "9f7dddbc-3354-4f55-a9ab-ae60877235ba";
    const token = await createAccessToken(userId);
    await expect(verifyAccessToken(token)).resolves.toBe(userId);
    await expect(verifyAccessToken(`${token.slice(0, -1)}x`)).resolves.toBeNull();
  });
});

describe("authentication input validation", () => {
  it("normalizes email and names while rejecting client-supplied roles", () => {
    const result = registerSchema.safeParse({
      email: "  ADITI@Example.com ",
      password: "SecurePassword123",
      firstName: "  Aditi  ",
      lastName: " Sharma ",
      role: "ROOT_ADMIN",
    });
    expect(result.success).toBe(false);

    const valid = registerSchema.parse({
      email: "ADITI@Example.com",
      password: "SecurePassword123",
      firstName: "  Aditi  ",
      lastName: " Sharma ",
    });
    expect(valid.email).toBe("aditi@example.com");
    expect(valid.firstName).toBe("Aditi");
  });

  it("rejects weak passwords and unknown login fields", () => {
    expect(
      registerSchema.safeParse({
        email: "a@example.com",
        password: "weak-password",
        firstName: "A",
        lastName: "B",
      }).success,
    ).toBe(false);
    expect(
      loginSchema.safeParse({
        email: "a@example.com",
        password: "password",
        institutionId: "9f7dddbc-3354-4f55-a9ab-ae60877235ba",
      }).success,
    ).toBe(false);
  });
});
