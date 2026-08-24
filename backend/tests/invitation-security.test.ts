import {
  InvitationStatus,
  InvitationType,
  OnboardingStatus,
  PersonType,
  type PrismaClient,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { InvitationService } from "../src/modules/invitations/invitation.service.js";
import { staffOnboardingSchema } from "../src/modules/onboarding/onboarding.schemas.js";
import type { MailService } from "../src/modules/notifications/mail.service.js";

const invitationId = "9f7dddbc-3354-4f55-a9ab-ae60877235ba";
const institutionId = "8a870c6d-95e4-4b5f-9bf1-0fef142f4f55";
const userId = "43ba4471-2200-4eb5-ad82-b93e7351d7d5";
const membershipId = "debb3a15-bc90-4d52-819a-f36f872f5351";
const onboardingId = "a39c9230-acf1-44f0-958b-5a5064fa6cf0";

const mail: MailService = {
  sendEmailVerification: vi.fn(),
  sendPasswordReset: vi.fn(),
  sendInvitation: vi.fn(),
};

function invitationFixture(overrides: Record<string, unknown> = {}) {
  return {
    invitationId,
    institutionId,
    invitationType: InvitationType.STUDENT,
    email: "student@example.com",
    phone: null,
    targetRoleId: "00000000-0000-4000-8000-000000000006",
    onboardingRecordId: onboardingId,
    tokenHash: "a".repeat(64),
    status: InvitationStatus.PENDING,
    expiresAt: new Date(Date.now() + 60_000),
    claimedAt: null,
    claimedByUserId: null,
    createdByMembershipId: membershipId,
    createdAt: new Date(),
    updatedAt: new Date(),
    institution: {
      institutionId,
      institutionCode: "ESQ-SCH-001",
      institutionName: "Example School",
      institutionType: "SCHOOL",
      boardId: null,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    targetRole: {
      roleId: "00000000-0000-4000-8000-000000000006",
      roleCode: "STUDENT",
      displayName: "Student",
      description: "Student",
      createdAt: new Date(),
    },
    onboardingRecord: {
      onboardingId,
      institutionId,
      personType: PersonType.STUDENT,
      firstName: "Student",
      middleName: null,
      lastName: "One",
      email: "student@example.com",
      phone: null,
      dateOfBirth: null,
      status: OnboardingStatus.INVITED,
      createdByMembershipId: membershipId,
      claimedByUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      studentDetails: {
        onboardingId,
        institutionId,
        admissionNumber: "ADM-001",
        academicSessionId: "0a97ff1d-3d7d-4b6f-ae47-3746c5f7b842",
        classSectionId: "e540716e-c560-4ed7-b55c-c69430544dad",
        guardianName: null,
        guardianPhone: null,
        admissionDate: new Date(),
      },
      employeeDetails: null,
    },
    ...overrides,
  };
}

function claimDatabase(invitation = invitationFixture(), userEmail = "student@example.com") {
  let queryNumber = 0;
  const transaction = {
    $queryRaw: vi.fn(async () => {
      queryNumber += 1;
      return queryNumber % 3 === 2 ? [{ invitation_id: invitationId }] : [];
    }),
    invitation: {
      findUnique: vi.fn(async () => invitation),
      update: vi.fn(async ({ data }) => {
        Object.assign(invitation, data);
        return invitation;
      }),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({
        userId,
        email: userEmail,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      }),
    },
    institutionMembership: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ membershipId, status: "ACTIVE" }),
      update: vi.fn(),
    },
    membershipRole: { createMany: vi.fn().mockResolvedValue({ count: 1 }) },
    student: {
      create: vi.fn().mockResolvedValue({ studentId: "136af763-f8f7-4ee8-83d3-a1b41269780d" }),
    },
    employee: { create: vi.fn() },
    onboardingRecord: { update: vi.fn().mockResolvedValue({}) },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  };

  let queue = Promise.resolve<unknown>(undefined);
  const database = {
    $transaction: vi.fn((operation) => {
      const result = queue.then(() => operation(transaction));
      queue = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    }),
  };
  return { database: database as unknown as PrismaClient, transaction };
}

describe("invitation claim security", () => {
  it("rejects an authenticated account whose verified email differs", async () => {
    const { database, transaction } = claimDatabase(
      invitationFixture(),
      "different@example.com",
    );
    const service = new InvitationService(database, mail);
    await expect(service.accept("x".repeat(43), userId)).rejects.toMatchObject({
      code: "INVITATION_RECIPIENT_MISMATCH",
    });
    expect(transaction.institutionMembership.create).not.toHaveBeenCalled();
  });

  it.each([
    ["expired", invitationFixture({ expiresAt: new Date(Date.now() - 1) })],
    ["revoked", invitationFixture({ status: InvitationStatus.REVOKED })],
    ["claimed", invitationFixture({ status: InvitationStatus.CLAIMED })],
  ])("rejects an %s invitation", async (_label, invitation) => {
    const { database, transaction } = claimDatabase(invitation);
    const service = new InvitationService(database, mail);
    await expect(service.accept("x".repeat(43), userId)).rejects.toMatchObject({
      code: "INVALID_INVITATION",
    });
    expect(transaction.membershipRole.createMany).not.toHaveBeenCalled();
  });

  it("allows only one of two concurrent claims to succeed", async () => {
    const { database, transaction } = claimDatabase();
    const service = new InvitationService(database, mail);
    const outcomes = await Promise.allSettled([
      service.accept("x".repeat(43), userId),
      service.accept("x".repeat(43), userId),
    ]);
    expect(outcomes.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter(({ status }) => status === "rejected")).toHaveLength(1);
    expect(transaction.student.create).toHaveBeenCalledTimes(1);
    expect(transaction.invitation.update).toHaveBeenCalledTimes(1);
  });
});

describe("onboarding validation", () => {
  it("does not allow a staff payload to claim the teacher employee type", () => {
    const result = staffOnboardingSchema.safeParse({
      firstName: "A",
      lastName: "B",
      email: "staff@example.com",
      employeeNumber: "EMP-1",
      employeeType: "TEACHER",
      joiningDate: "2026-08-25",
    });
    expect(result.success).toBe(false);
  });
});
