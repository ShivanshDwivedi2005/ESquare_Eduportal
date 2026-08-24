import { ChallengePurpose, UserStatus, type PrismaClient } from "@prisma/client";

import { ApplicationError } from "../../common/errors.js";
import { getEnvironment } from "../../config/env.js";
import { createAccessToken } from "../../security/access-token.js";
import {
  generateOpaqueToken,
  generateVerificationCode,
  sha256,
  verificationCodeDigest,
} from "../../security/crypto.js";
import { hashPassword, verifyPassword } from "../../security/password.js";
import { writeAuditLog, type AuditContext } from "../audit/audit.service.js";
import type { MailService } from "../notifications/mail.service.js";
import { AuthRepository } from "./auth.repository.js";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from "./auth.schemas.js";

const genericRegistrationMessage =
  "If this address can be registered, a verification code has been sent";
const genericResetMessage =
  "If an eligible account exists, a password reset message has been sent";

export interface SessionMetadata {
  ipAddress: string | undefined;
  userAgent: string | undefined;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

function publicUserId(userId: string): string {
  return `ESQ-${userId.replaceAll("-", "").slice(0, 12).toUpperCase()}`;
}

export class AuthService {
  private readonly repository: AuthRepository;

  public constructor(
    private readonly database: PrismaClient,
    private readonly mail: MailService,
  ) {
    this.repository = new AuthRepository(database);
  }

  public async register(input: RegisterInput): Promise<{ message: string }> {
    const environment = getEnvironment();
    const now = new Date();
    const passwordHash = await hashPassword(input.password);
    const code = generateVerificationCode();
    const tokenHash = verificationCodeDigest(
      input.email,
      code,
      environment.JWT_REFRESH_SECRET,
    );

    const shouldDeliver = await this.repository.transaction(async (transaction) => {
      const user = await transaction.user.upsert({
        where: { email: input.email },
        update: {},
        create: {
          email: input.email,
          passwordHash,
          status: UserStatus.ACTIVE,
          profile: {
            create: {
              firstName: input.firstName,
              middleName: input.middleName ?? null,
              lastName: input.lastName,
            },
          },
        },
        include: { profile: true },
      });

      if (user.emailVerifiedAt || user.status === UserStatus.DELETED) return false;

      await transaction.user.update({
        where: { userId: user.userId },
        data: {
          passwordHash,
          status: UserStatus.ACTIVE,
          profile: {
            upsert: {
              create: {
                firstName: input.firstName,
                middleName: input.middleName ?? null,
                lastName: input.lastName,
              },
              update: {
                firstName: input.firstName,
                middleName: input.middleName ?? null,
                lastName: input.lastName,
              },
            },
          },
        },
      });
      await transaction.verificationChallenge.updateMany({
        where: {
          email: input.email,
          purpose: ChallengePurpose.EMAIL_VERIFICATION,
          consumedAt: null,
        },
        data: { consumedAt: now },
      });
      await transaction.verificationChallenge.create({
        data: {
          userId: user.userId,
          email: input.email,
          purpose: ChallengePurpose.EMAIL_VERIFICATION,
          tokenHash,
          expiresAt: addMinutes(now, environment.EMAIL_VERIFICATION_TTL_MINUTES),
        },
      });
      return true;
    });

    if (shouldDeliver) await this.mail.sendEmailVerification(input.email, code);
    return { message: genericRegistrationMessage };
  }

  public async verifyEmail(input: VerifyEmailInput): Promise<{ message: string }> {
    const environment = getEnvironment();
    const expectedHash = verificationCodeDigest(
      input.email,
      input.code,
      environment.JWT_REFRESH_SECRET,
    );

    const outcome = await this.repository.transaction(async (transaction) => {
      const challenge = await this.repository.lockLatestEmailChallenge(
        transaction,
        input.email,
      );
      if (!challenge || !challenge.user_id) {
        return "invalid" as const;
      }
      if (challenge.attempts >= 5) {
        return "attempts_exceeded" as const;
      }
      if (challenge.expires_at <= new Date()) {
        await transaction.verificationChallenge.update({
          where: { challengeId: challenge.challenge_id },
          data: { consumedAt: new Date() },
        });
        return "invalid" as const;
      }
      if (challenge.token_hash !== expectedHash) {
        await transaction.verificationChallenge.update({
          where: { challengeId: challenge.challenge_id },
          data: { attempts: { increment: 1 } },
        });
        return "invalid" as const;
      }

      const verifiedAt = new Date();
      await transaction.verificationChallenge.update({
        where: { challengeId: challenge.challenge_id },
        data: { consumedAt: verifiedAt },
      });
      await transaction.user.update({
        where: { userId: challenge.user_id },
        data: { emailVerifiedAt: verifiedAt },
      });
      return "verified" as const;
    });
    if (outcome === "attempts_exceeded") {
      throw new ApplicationError(429, "VERIFICATION_ATTEMPTS_EXCEEDED", "Request a new code");
    }
    if (outcome !== "verified") {
      throw new ApplicationError(400, "INVALID_VERIFICATION_CODE", "Invalid or expired code");
    }
    return { message: "Email verified" };
  }

  public async login(
    input: LoginInput,
    metadata: SessionMetadata,
  ): Promise<{ accessToken: string; refreshToken: string; user: object }> {
    const user = await this.repository.findUserByEmail(this.database, input.email);
    const passwordValid = await verifyPassword(user?.passwordHash, input.password);
    if (!user || !passwordValid || user.status !== UserStatus.ACTIVE) {
      if (user) await this.auditFailedLogin(user.userId, metadata, "invalid_credentials_or_status");
      throw new ApplicationError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
    }
    if (!user.emailVerifiedAt) {
      throw new ApplicationError(403, "EMAIL_NOT_VERIFIED", "Verify your email before signing in");
    }

    const refreshToken = generateOpaqueToken();
    const environment = getEnvironment();
    await this.database.refreshSession.create({
      data: {
        userId: user.userId,
        tokenHash: sha256(refreshToken),
        expiresAt: addDays(new Date(), environment.REFRESH_TOKEN_TTL_DAYS),
        ipAddress: metadata.ipAddress ?? null,
        userAgent: metadata.userAgent?.slice(0, 500) ?? null,
      },
    });
    return {
      accessToken: await createAccessToken(user.userId),
      refreshToken,
      user: await this.userView(user.userId),
    };
  }

  public async refresh(
    refreshToken: string | undefined,
    metadata: SessionMetadata,
  ): Promise<{ accessToken: string; refreshToken: string; user: object }> {
    if (!refreshToken) {
      throw new ApplicationError(401, "INVALID_SESSION", "Sign in required");
    }
    const nextRawToken = generateOpaqueToken();
    const environment = getEnvironment();

    const rotation = await this.repository.transaction(async (transaction) => {
      const locked = await this.repository.lockRefreshSession(
        transaction,
        sha256(refreshToken),
      );
      if (!locked || locked.expires_at <= new Date()) {
        return { outcome: "invalid" as const };
      }
      if (locked.revoked_at) {
        // Reuse of a rotated token may indicate theft. Revoke the entire session family.
        await transaction.refreshSession.updateMany({
          where: { userId: locked.user_id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        return { outcome: "invalid" as const };
      }
      const user = await transaction.user.findUnique({ where: { userId: locked.user_id } });
      if (!user || user.status !== UserStatus.ACTIVE || !user.emailVerifiedAt) {
        await transaction.refreshSession.updateMany({
          where: { userId: locked.user_id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        return { outcome: "invalid" as const };
      }
      const nextSession = await transaction.refreshSession.create({
        data: {
          userId: user.userId,
          tokenHash: sha256(nextRawToken),
          expiresAt: addDays(new Date(), environment.REFRESH_TOKEN_TTL_DAYS),
          ipAddress: metadata.ipAddress ?? null,
          userAgent: metadata.userAgent?.slice(0, 500) ?? null,
        },
      });
      await transaction.refreshSession.update({
        where: { sessionId: locked.session_id },
        data: { revokedAt: new Date(), replacedBySessionId: nextSession.sessionId },
      });
      return { outcome: "rotated" as const, userId: user.userId };
    });
    if (rotation.outcome !== "rotated") {
      throw new ApplicationError(401, "INVALID_SESSION", "Sign in required");
    }

    return {
      accessToken: await createAccessToken(rotation.userId),
      refreshToken: nextRawToken,
      user: await this.userView(rotation.userId),
    };
  }

  public async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    await this.database.refreshSession.updateMany({
      where: { tokenHash: sha256(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  public async forgotPassword(input: ForgotPasswordInput): Promise<{ message: string }> {
    const user = await this.repository.findUserByEmail(this.database, input.email);
    if (!user || user.status !== UserStatus.ACTIVE || !user.emailVerifiedAt) {
      return { message: genericResetMessage };
    }

    const environment = getEnvironment();
    const rawToken = generateOpaqueToken();
    const now = new Date();
    await this.repository.transaction(async (transaction) => {
      await transaction.verificationChallenge.updateMany({
        where: {
          userId: user.userId,
          purpose: ChallengePurpose.PASSWORD_RESET,
          consumedAt: null,
        },
        data: { consumedAt: now },
      });
      await transaction.verificationChallenge.create({
        data: {
          userId: user.userId,
          email: user.email,
          purpose: ChallengePurpose.PASSWORD_RESET,
          tokenHash: sha256(rawToken),
          expiresAt: addMinutes(now, environment.PASSWORD_RESET_TTL_MINUTES),
        },
      });
    });
    await this.mail.sendPasswordReset(user.email, rawToken);
    return { message: genericResetMessage };
  }

  public async resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    const passwordHash = await hashPassword(input.password);
    await this.repository.transaction(async (transaction) => {
      const challenge = await this.repository.lockChallengeByHash(
        transaction,
        sha256(input.token),
        ChallengePurpose.PASSWORD_RESET,
      );
      if (
        !challenge ||
        !challenge.user_id ||
        challenge.consumed_at ||
        challenge.expires_at <= new Date()
      ) {
        throw new ApplicationError(400, "INVALID_RESET_TOKEN", "Invalid or expired reset token");
      }
      const now = new Date();
      await transaction.user.update({
        where: { userId: challenge.user_id },
        data: { passwordHash },
      });
      await transaction.verificationChallenge.update({
        where: { challengeId: challenge.challenge_id },
        data: { consumedAt: now },
      });
      await transaction.refreshSession.updateMany({
        where: { userId: challenge.user_id, revokedAt: null },
        data: { revokedAt: now },
      });
    });
    return { message: "Password reset complete" };
  }

  public async userView(userId: string): Promise<object> {
    const user = await this.repository.getUserView(this.database, userId);
    if (!user) throw new ApplicationError(404, "USER_NOT_FOUND", "User not found");
    return {
      userId: user.userId,
      publicId: publicUserId(user.userId),
      email: user.email,
      phone: user.phone,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      profile: user.profile
        ? {
            firstName: user.profile.firstName,
            middleName: user.profile.middleName,
            lastName: user.profile.lastName,
            dateOfBirth: user.profile.dateOfBirth,
            gender: user.profile.gender,
            profilePhotoFileId: user.profile.profilePhotoFileId,
          }
        : null,
      memberships: user.memberships.map((membership) => ({
        membershipId: membership.membershipId,
        status: membership.status,
        institution: membership.institution,
        roles: membership.roles.map(({ role }) => role.roleCode),
      })),
    };
  }

  private async auditFailedLogin(
    userId: string,
    metadata: SessionMetadata,
    reason: string,
  ): Promise<void> {
    await this.repository.transaction(async (transaction) => {
      const context: AuditContext = {
        actorUserId: userId,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      };
      await writeAuditLog(transaction, context, {
        action: "login.failed",
        entityType: "user",
        entityId: userId,
        metadata: { reason },
      });
    });
  }
}
