import argon2 from "argon2";
import { PlatformRole, Prisma, PrismaClient, UserStatus } from "@prisma/client";

import {
  PERMISSION_CODES,
  type PermissionCode,
  ROLE_PERMISSION_GRANTS,
  ROLE_CODES,
  type RoleCode,
} from "../src/security/authorization-catalog.js";

const database = new PrismaClient();

const roleDescriptions: Record<RoleCode, { displayName: string; description: string }> = {
  ROOT_ADMIN: {
    displayName: "Root Administrator",
    description: "Institution owner with controlled administrative authority.",
  },
  ADMISSION_ADMIN: {
    displayName: "Admission Administrator",
    description: "Manages student, teacher, and staff onboarding without privilege-granting authority.",
  },
  FINANCE_ADMIN: {
    displayName: "Finance Administrator",
    description: "Views and manages institution finance workflows.",
  },
  PRINCIPAL: {
    displayName: "Principal",
    description: "Manages institution academic structure and views institutional records.",
  },
  TEACHER: {
    displayName: "Teacher",
    description: "Employee role for academic teaching responsibilities.",
  },
  STUDENT: {
    displayName: "Student",
    description: "Student membership within an institution.",
  },
  STAFF: {
    displayName: "Staff",
    description: "General non-teaching employee membership.",
  },
};

const permissionDescriptions: Record<PermissionCode, string> = {
  INSTITUTION_VIEW: "View institution information.",
  INSTITUTION_SETTINGS_MANAGE: "Manage institution settings.",
  ADMIN_VIEW: "View institution administrators.",
  ADMIN_CREATE: "Invite an approved institution administrator role.",
  ADMIN_DISABLE: "Suspend an institution administrator membership.",
  ADMIN_ASSIGN_ROLE: "Assign an explicitly approved institution administrator role.",
  STUDENT_CREATE: "Create student onboarding records.",
  STUDENT_VIEW: "View tenant-scoped student records.",
  STUDENT_UPDATE: "Update tenant-scoped student records.",
  TEACHER_CREATE: "Create teacher onboarding records.",
  TEACHER_VIEW: "View tenant-scoped teacher records.",
  TEACHER_UPDATE: "Update tenant-scoped teacher records.",
  STAFF_CREATE: "Create staff onboarding records.",
  STAFF_VIEW: "View tenant-scoped staff records.",
  STAFF_UPDATE: "Update tenant-scoped staff records.",
  ADMISSION_INVITE_SEND: "Send admissions invitations.",
  ADMISSION_INVITE_RESEND: "Rotate and resend pending admissions invitations.",
  ADMISSION_INVITE_REVOKE: "Revoke pending admissions invitations.",
  ACADEMIC_SESSION_MANAGE: "Manage academic sessions.",
  CLASS_SECTION_MANAGE: "Manage class sections.",
  FINANCE_VIEW: "View finance data.",
  FINANCE_MANAGE: "Manage finance workflows.",
  AUDIT_VIEW: "View institution audit history.",
};

function stableUuid(kind: "role" | "permission", index: number): string {
  const family = kind === "role" ? "4000" : "4001";
  return `00000000-0000-${family}-8000-${String(index + 1).padStart(12, "0")}`;
}

async function seedAuthorizationCatalog(client: Prisma.TransactionClient): Promise<void> {
  const permissions = new Map<PermissionCode, string>();
  for (const [index, permissionCode] of PERMISSION_CODES.entries()) {
    const permission = await client.permission.upsert({
      where: { permissionCode },
      update: { description: permissionDescriptions[permissionCode] },
      create: {
        permissionId: stableUuid("permission", index),
        permissionCode,
        description: permissionDescriptions[permissionCode],
      },
    });
    permissions.set(permissionCode, permission.permissionId);
  }

  for (const [index, roleCode] of ROLE_CODES.entries()) {
    const role = await client.role.upsert({
      where: { roleCode },
      update: roleDescriptions[roleCode],
      create: {
        roleId: stableUuid("role", index),
        roleCode,
        ...roleDescriptions[roleCode],
      },
    });

    await client.rolePermission.deleteMany({ where: { roleId: role.roleId } });
    await client.rolePermission.createMany({
      data: ROLE_PERMISSION_GRANTS[roleCode].map((permissionCode) => ({
        roleId: role.roleId,
        permissionId: permissions.get(permissionCode)!,
      })),
      skipDuplicates: true,
    });
  }
}

async function seedBoards(client: Prisma.TransactionClient): Promise<void> {
  const boards = [
    ["CBSE", "Central Board of Secondary Education"],
    ["CISCE", "Council for the Indian School Certificate Examinations"],
  ] as const;
  for (const [boardCode, displayName] of boards) {
    await client.board.upsert({
      where: { boardCode },
      update: { displayName },
      create: { boardCode, displayName },
    });
  }
}

async function seedPlatformAdministrator(client: Prisma.TransactionClient): Promise<void> {
  const email = process.env.SEED_PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_PLATFORM_ADMIN_PASSWORD;
  if (!email && !password) return;
  if (!email || !password || password.length < 14) {
    throw new Error(
      "SEED_PLATFORM_ADMIN_EMAIL and a password of at least 14 characters must be supplied together",
    );
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const user = await client.user.upsert({
    where: { email },
    update: { status: UserStatus.ACTIVE },
    create: {
      email,
      passwordHash,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          firstName: process.env.SEED_PLATFORM_ADMIN_FIRST_NAME?.trim() || "Platform",
          lastName: process.env.SEED_PLATFORM_ADMIN_LAST_NAME?.trim() || "Administrator",
        },
      },
    },
  });

  await client.platformUserRole.upsert({
    where: {
      userId_role: {
        userId: user.userId,
        role: PlatformRole.PLATFORM_SUPER_ADMIN,
      },
    },
    update: {},
    create: {
      userId: user.userId,
      role: PlatformRole.PLATFORM_SUPER_ADMIN,
    },
  });
}

async function main(): Promise<void> {
  await database.$transaction(async (client) => {
    await seedAuthorizationCatalog(client);
    await seedBoards(client);
    await seedPlatformAdministrator(client);
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await database.$disconnect();
  });
