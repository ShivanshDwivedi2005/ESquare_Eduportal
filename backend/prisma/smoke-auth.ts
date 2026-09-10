import { database } from "../src/database/client.js";
import { AuthService } from "../src/modules/auth/auth.service.js";
import type { MailService } from "../src/modules/notifications/mail.service.js";

const email = `auth-smoke-${Date.now()}@example.invalid`;
const password = "SmokeTestPassword123";
let verificationCode: string | undefined;

const mail: MailService = {
  async sendEmailVerification(_email, code) {
    verificationCode = code;
  },
  async sendPasswordReset() {},
  async sendInvitation() {},
};

async function main(): Promise<void> {
  const service = new AuthService(database, mail);
  let completed = false;
  try {
    await service.register({
      email,
      password,
      firstName: "Auth",
      lastName: "Smoke",
    });
    if (!verificationCode) throw new Error("Registration did not produce a verification code");

    await service.verifyEmail({ email, code: verificationCode });
    const result = await service.login(
      { email, password },
      { ipAddress: "127.0.0.1", userAgent: "esquare-auth-smoke-test" },
    );
    if (!result.accessToken || !result.refreshToken) {
      throw new Error("Login did not produce both session tokens");
    }
    console.log("Auth smoke test passed: register, verify, and login all succeeded.");
    completed = true;
  } finally {
    try {
      await database.user.deleteMany({ where: { email } });
    } catch (error) {
      if (completed) throw error;
      console.error("Auth smoke cleanup also failed:", error);
    }
    await database.$disconnect();
  }
}

void main();
