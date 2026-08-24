import { type PrismaClient, RegistrationRequestStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { ApplicationError } from "../src/common/errors.js";
import {
  createInstitutionRequestSchema,
  requestListQuerySchema,
} from "../src/modules/institution-requests/institution-request.schemas.js";
import { InstitutionRequestService } from "../src/modules/institution-requests/institution-request.service.js";
import { InstitutionService } from "../src/modules/institutions/institution.service.js";
import { ROLE_PERMISSION_GRANTS } from "../src/security/authorization-catalog.js";

const requestId = "9f7dddbc-3354-4f55-a9ab-ae60877235ba";
const reviewerId = "8a870c6d-95e4-4b5f-9bf1-0fef142f4f55";
const submitterId = "43ba4471-2200-4eb5-ad82-b93e7351d7d5";
const institutionId = "debb3a15-bc90-4d52-819a-f36f872f5351";
const membershipId = "a39c9230-acf1-44f0-958b-5a5064fa6cf0";

function approvalDatabase(
  status: RegistrationRequestStatus = RegistrationRequestStatus.UNDER_REVIEW,
) {
  const events: string[] = [];
  const transaction = {
    $queryRaw: vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ request_id: requestId }]),
    institutionRegistrationRequest: {
      findUnique: vi.fn().mockResolvedValue({
        requestId,
        status,
        approvedInstitutionId: null,
        institutionType: "SCHOOL",
        institutionName: "Example School",
        boardId: null,
        submittedByUserId: submitterId,
      }),
      update: vi.fn().mockImplementation(async () => {
        events.push("request-approved");
        return {};
      }),
    },
    role: {
      findUnique: vi.fn().mockResolvedValue({ roleId: "00000000-0000-4000-8000-000000000001" }),
    },
    institution: {
      create: vi.fn().mockImplementation(async () => {
        events.push("institution-created");
        return {
          institutionId,
          institutionCode: "ESQ-SCH-9F7DDDBC33",
          institutionName: "Example School",
        };
      }),
    },
    institutionMembership: {
      create: vi.fn().mockImplementation(async () => {
        events.push("membership-created");
        return { membershipId };
      }),
    },
    membershipRole: {
      create: vi.fn().mockImplementation(async () => {
        events.push("root-role-assigned");
        return {};
      }),
    },
    auditLog: {
      create: vi.fn().mockImplementation(async () => {
        events.push("audit-written");
        return {};
      }),
    },
  };
  const database = {
    $transaction: vi.fn(async (operation, options) => operation(transaction, options)),
  };
  return { database: database as unknown as PrismaClient, transaction, events };
}

describe("institution approval transaction", () => {
  it("creates institution, root membership, role, approval, and audit in one serializable transaction", async () => {
    const { database, events } = approvalDatabase();
    const service = new InstitutionRequestService(database);
    const result = await service.approve(requestId, { userId: reviewerId });

    expect(result).toMatchObject({
      status: RegistrationRequestStatus.APPROVED,
      rootMembershipId: membershipId,
      institution: { institutionId },
    });
    expect(events).toEqual([
      "institution-created",
      "membership-created",
      "root-role-assigned",
      "request-approved",
      "audit-written",
    ]);
    expect(database.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ isolationLevel: "Serializable" }),
    );
  });

  it("cannot approve an already approved request twice", async () => {
    const { database, transaction } = approvalDatabase(RegistrationRequestStatus.APPROVED);
    const service = new InstitutionRequestService(database);
    await expect(service.approve(requestId, { userId: reviewerId })).rejects.toMatchObject({
      code: "REQUEST_STATE_CONFLICT",
    });
    expect(transaction.institution.create).not.toHaveBeenCalled();
  });
});

describe("tenant RBAC rules", () => {
  it("does not grant admissions or privilege management to finance administrators", () => {
    expect(ROLE_PERMISSION_GRANTS.FINANCE_ADMIN).not.toContain("STUDENT_CREATE");
    expect(ROLE_PERMISSION_GRANTS.FINANCE_ADMIN).not.toContain("ADMIN_ASSIGN_ROLE");
  });

  it("does not grant administrative role assignment to admission administrators", async () => {
    const database = {
      $transaction: vi.fn(() => {
        throw new Error("database must not be reached");
      }),
    } as unknown as PrismaClient;
    const service = new InstitutionService(database);
    await expect(
      service.updateRoles(
        membershipId,
        ["ROOT_ADMIN"],
        [],
        {
          userId: submitterId,
          institutionId,
          membershipId: "136af763-f8f7-4ee8-83d3-a1b41269780d",
          roleCodes: ["ADMISSION_ADMIN"],
        },
      ),
    ).rejects.toBeInstanceOf(ApplicationError);
    expect(database.$transaction).not.toHaveBeenCalled();
  });
});

describe("institution request validation", () => {
  it("normalizes safe fields and rejects client-controlled status", () => {
    const base = {
      institutionName: "Example School",
      institutionType: "SCHOOL",
      officialEmail: "ADMIN@Example.com",
      officialPhone: "+919876543210",
      addressLine1: "1 Example Road",
      city: "Delhi",
      state: "Delhi",
      postalCode: "110001",
      country: "in",
    };
    expect(
      createInstitutionRequestSchema.safeParse({ ...base, status: "APPROVED" }).success,
    ).toBe(false);
    const parsed = createInstitutionRequestSchema.parse(base);
    expect(parsed.officialEmail).toBe("admin@example.com");
    expect(parsed.country).toBe("IN");
  });

  it("allows only explicitly supported sort values", () => {
    expect(
      requestListQuerySchema.safeParse({ sort: "created_at; DROP TABLE users" }).success,
    ).toBe(false);
  });
});
