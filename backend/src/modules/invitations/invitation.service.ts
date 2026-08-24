import {
  InvitationStatus,
  InvitationType,
  MembershipStatus,
  OnboardingStatus,
  PersonType,
  UserStatus,
  type Prisma,
  type PrismaClient,
} from "@prisma/client";

import { ApplicationError } from "../../common/errors.js";
import {
  withInvitationTransaction,
  withTenantTransaction,
} from "../../database/authorized-transaction.js";
import { getEnvironment } from "../../config/env.js";
import { generateOpaqueToken, sha256 } from "../../security/crypto.js";
import {
  mayAssignRole,
  ROLE_CODES,
  type RoleCode,
} from "../../security/authorization-catalog.js";
import { writeAuditLog } from "../audit/audit.service.js";
import type { InstitutionActor } from "../institutions/institution.service.js";
import type { MailService } from "../notifications/mail.service.js";
import { InvitationRepository } from "./invitation.repository.js";

export interface InvitationActor extends InstitutionActor {
  permissionCodes: string[];
}

export interface OnboardingInvitationInput {
  institutionId: string;
  onboardingRecordId: string;
  email: string;
  invitationType: InvitationType;
  targetRoleId: string;
  createdByMembershipId: string;
}

const safeInvitationSelect = {
  invitationId: true,
  institutionId: true,
  invitationType: true,
  email: true,
  phone: true,
  targetRole: { select: { roleCode: true, displayName: true } },
  onboardingRecordId: true,
  status: true,
  expiresAt: true,
  claimedAt: true,
  claimedByUserId: true,
  createdByMembershipId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.InvitationSelect;

export class InvitationService {
  private readonly repository = new InvitationRepository();

  public constructor(
    private readonly database: PrismaClient,
    private readonly mail: MailService,
  ) {}

  public async createAdminInvitation(
    email: string,
    targetRoleCode: "ADMISSION_ADMIN" | "FINANCE_ADMIN" | "PRINCIPAL",
    actor: InvitationActor,
  ): Promise<object> {
    const actorRoles = this.knownRoles(actor.roleCodes);
    if (!mayAssignRole(actorRoles, targetRoleCode)) {
      throw new ApplicationError(403, "ROLE_ASSIGNMENT_DENIED", "Role cannot be assigned");
    }
    const rawToken = generateOpaqueToken();
    const result = await withTenantTransaction(
      actor,
      async (transaction) => {
        const role = await transaction.role.findUnique({
          where: { roleCode: targetRoleCode },
        });
        if (!role) {
          throw new ApplicationError(500, "AUTHORIZATION_CATALOG_MISSING", "Configuration error", false);
        }
        const existing = await transaction.invitation.findFirst({
          where: {
            institutionId: actor.institutionId,
            email,
            invitationType: InvitationType.ADMIN,
            targetRoleId: role.roleId,
            status: InvitationStatus.PENDING,
            expiresAt: { gt: new Date() },
          },
        });
        if (existing) {
          throw new ApplicationError(409, "INVITATION_ALREADY_PENDING", "An invitation is already pending");
        }
        const institution = await transaction.institution.findUnique({
          where: { institutionId: actor.institutionId },
          select: { institutionName: true },
        });
        if (!institution) throw new ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found");
        const invitation = await transaction.invitation.create({
          data: {
            institutionId: actor.institutionId,
            invitationType: InvitationType.ADMIN,
            email,
            targetRoleId: role.roleId,
            tokenHash: sha256(rawToken),
            expiresAt: this.expiresAt(),
            createdByMembershipId: actor.membershipId,
          },
          select: safeInvitationSelect,
        });
        await writeAuditLog(transaction, this.auditContext(actor), {
          action: "admin.invited",
          entityType: "invitation",
          entityId: invitation.invitationId,
          metadata: { targetRoleCode },
        });
        return { invitation, institutionName: institution.institutionName };
      },
      this.database,
    );
    await this.mail.sendInvitation(
      email,
      rawToken,
      result.institutionName,
      InvitationType.ADMIN,
    );
    return result.invitation;
  }

  public async createForOnboarding(
    transaction: Prisma.TransactionClient,
    input: OnboardingInvitationInput,
  ): Promise<{ rawToken: string; invitationId: string; expiresAt: Date }> {
    const rawToken = generateOpaqueToken();
    const invitation = await transaction.invitation.create({
      data: {
        institutionId: input.institutionId,
        invitationType: input.invitationType,
        email: input.email,
        targetRoleId: input.targetRoleId,
        onboardingRecordId: input.onboardingRecordId,
        tokenHash: sha256(rawToken),
        expiresAt: this.expiresAt(),
        createdByMembershipId: input.createdByMembershipId,
      },
      select: { invitationId: true, expiresAt: true },
    });
    return { rawToken, ...invitation };
  }

  public async list(
    actor: InvitationActor,
    query: {
      limit: number;
      cursor?: string | undefined;
      status?: InvitationStatus | undefined;
      type?: InvitationType | undefined;
    },
  ): Promise<object> {
    return withTenantTransaction(
      actor,
      async (transaction) => {
        await transaction.invitation.updateMany({
          where: {
            institutionId: actor.institutionId,
            status: InvitationStatus.PENDING,
            expiresAt: { lte: new Date() },
          },
          data: { status: InvitationStatus.EXPIRED },
        });
        const rows = await transaction.invitation.findMany({
          where: {
            institutionId: actor.institutionId,
            ...(query.status ? { status: query.status } : {}),
            ...(query.type ? { invitationType: query.type } : {}),
          },
          select: safeInvitationSelect,
          take: query.limit + 1,
          ...(query.cursor ? { cursor: { invitationId: query.cursor }, skip: 1 } : {}),
          orderBy: [{ createdAt: "desc" }, { invitationId: "desc" }],
        });
        const hasMore = rows.length > query.limit;
        const items = hasMore ? rows.slice(0, query.limit) : rows;
        return {
          items,
          nextCursor: hasMore ? items.at(-1)?.invitationId ?? null : null,
        };
      },
      this.database,
    );
  }

  public async resend(invitationId: string, actor: InvitationActor): Promise<object> {
    const rawToken = generateOpaqueToken();
    const result = await withTenantTransaction(
      actor,
      async (transaction) => {
        if (!(await this.repository.lockById(transaction, invitationId, actor.institutionId))) {
          throw new ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found");
        }
        const invitation = await transaction.invitation.findUnique({
          where: { invitationId },
          include: { institution: { select: { institutionName: true } } },
        });
        if (
          !invitation ||
          (invitation.status !== InvitationStatus.PENDING &&
            invitation.status !== InvitationStatus.EXPIRED) ||
          !invitation.email
        ) {
          throw new ApplicationError(409, "INVITATION_STATE_CONFLICT", "Invitation cannot be resent");
        }
        this.requireInvitationPermission(invitation.invitationType, actor, "resend");
        const updated = await transaction.invitation.update({
          where: { invitationId },
          data: {
            tokenHash: sha256(rawToken),
            expiresAt: this.expiresAt(),
            status: InvitationStatus.PENDING,
          },
          select: safeInvitationSelect,
        });
        await writeAuditLog(transaction, this.auditContext(actor), {
          action:
            invitation.invitationType === InvitationType.ADMIN
              ? "admin.invitation.resent"
              : `${invitation.invitationType.toLowerCase()}.invitation.resent`,
          entityType: "invitation",
          entityId: invitationId,
        });
        return {
          invitation: updated,
          email: invitation.email,
          institutionName: invitation.institution.institutionName,
          invitationType: invitation.invitationType,
        };
      },
      this.database,
    );
    await this.mail.sendInvitation(
      result.email,
      rawToken,
      result.institutionName,
      result.invitationType,
    );
    return result.invitation;
  }

  public async revoke(invitationId: string, actor: InvitationActor): Promise<object> {
    return withTenantTransaction(
      actor,
      async (transaction) => {
        if (!(await this.repository.lockById(transaction, invitationId, actor.institutionId))) {
          throw new ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found");
        }
        const invitation = await transaction.invitation.findUnique({ where: { invitationId } });
        if (!invitation || invitation.status !== InvitationStatus.PENDING) {
          throw new ApplicationError(409, "INVITATION_STATE_CONFLICT", "Invitation cannot be revoked");
        }
        this.requireInvitationPermission(invitation.invitationType, actor, "revoke");
        const updated = await transaction.invitation.update({
          where: { invitationId },
          data: { status: InvitationStatus.REVOKED },
          select: safeInvitationSelect,
        });
        await writeAuditLog(transaction, this.auditContext(actor), {
          action:
            invitation.invitationType === InvitationType.ADMIN
              ? "admin.invitation.revoked"
              : `${invitation.invitationType.toLowerCase()}.invitation.revoked`,
          entityType: "invitation",
          entityId: invitationId,
        });
        return updated;
      },
      this.database,
    );
  }

  public async validate(rawToken: string): Promise<object> {
    const tokenHash = sha256(rawToken);
    return withInvitationTransaction(
      tokenHash,
      null,
      async (transaction) => {
        const invitation = await transaction.invitation.findUnique({
          where: { tokenHash },
          select: {
            invitationType: true,
            email: true,
            status: true,
            expiresAt: true,
            institution: {
              select: { institutionName: true, institutionType: true, status: true },
            },
            targetRole: { select: { displayName: true } },
          },
        });
        if (
          !invitation ||
          invitation.status !== InvitationStatus.PENDING ||
          invitation.expiresAt <= new Date() ||
          invitation.institution.status !== "ACTIVE"
        ) {
          throw new ApplicationError(400, "INVALID_INVITATION", "Invalid or expired invitation");
        }
        return {
          invitationType: invitation.invitationType,
          recipient: invitation.email ? this.maskEmail(invitation.email) : null,
          institution: {
            institutionName: invitation.institution.institutionName,
            institutionType: invitation.institution.institutionType,
          },
          targetRole: invitation.targetRole?.displayName ?? null,
          expiresAt: invitation.expiresAt,
        };
      },
      this.database,
    );
  }

  public async accept(rawToken: string, userId: string): Promise<object> {
    const tokenHash = sha256(rawToken);
    return withInvitationTransaction(
      tokenHash,
      userId,
      async (transaction) => {
        const invitationId = await this.repository.lockByTokenHash(transaction, tokenHash);
        if (!invitationId) {
          throw new ApplicationError(400, "INVALID_INVITATION", "Invalid or expired invitation");
        }
        const invitation = await transaction.invitation.findUnique({
          where: { invitationId },
          include: {
            institution: true,
            targetRole: true,
            onboardingRecord: {
              include: { studentDetails: true, employeeDetails: true },
            },
          },
        });
        if (
          !invitation ||
          invitation.status !== InvitationStatus.PENDING ||
          invitation.expiresAt <= new Date() ||
          invitation.institution.status !== "ACTIVE" ||
          !invitation.email ||
          !invitation.targetRole
        ) {
          throw new ApplicationError(400, "INVALID_INVITATION", "Invalid or expired invitation");
        }

        await transaction.$queryRaw`
          SELECT set_config('app.current_institution_id', ${invitation.institutionId}, true)
        `;
        const user = await transaction.user.findUnique({ where: { userId } });
        if (
          !user ||
          user.status !== UserStatus.ACTIVE ||
          !user.emailVerifiedAt ||
          user.email.toLowerCase() !== invitation.email.toLowerCase()
        ) {
          throw new ApplicationError(403, "INVITATION_RECIPIENT_MISMATCH", "Invitation recipient does not match");
        }

        let membership = await transaction.institutionMembership.findUnique({
          where: {
            institutionId_userId: {
              institutionId: invitation.institutionId,
              userId,
            },
          },
        });
        if (membership?.status === MembershipStatus.SUSPENDED || membership?.status === MembershipStatus.LEFT) {
          throw new ApplicationError(409, "MEMBERSHIP_STATE_CONFLICT", "Membership cannot accept invitation");
        }
        if (!membership) {
          membership = await transaction.institutionMembership.create({
            data: {
              institutionId: invitation.institutionId,
              userId,
              status: MembershipStatus.ACTIVE,
            },
          });
        } else if (membership.status === MembershipStatus.PENDING) {
          membership = await transaction.institutionMembership.update({
            where: { membershipId: membership.membershipId },
            data: { status: MembershipStatus.ACTIVE },
          });
        }

        await transaction.membershipRole.createMany({
          data: [
            {
              membershipId: membership.membershipId,
              roleId: invitation.targetRoleId!,
              assignedByMembershipId: invitation.createdByMembershipId,
            },
          ],
          skipDuplicates: true,
        });

        const entity = await this.activateOnboarding(transaction, invitation, userId);
        const claimedAt = new Date();
        await transaction.invitation.update({
          where: { invitationId },
          data: {
            status: InvitationStatus.CLAIMED,
            claimedAt,
            claimedByUserId: userId,
          },
        });
        await writeAuditLog(
          transaction,
          {
            actorUserId: userId,
            actorMembershipId: membership.membershipId,
            institutionId: invitation.institutionId,
          },
          {
            action: `${invitation.invitationType.toLowerCase()}.invitation.claimed`,
            entityType: "invitation",
            entityId: invitationId,
            metadata: entity ? { entityId: entity.entityId } : {},
          },
        );
        return {
          invitationId,
          status: InvitationStatus.CLAIMED,
          claimedAt,
          membershipId: membership.membershipId,
          role: invitation.targetRole.roleCode,
          entity,
        };
      },
      this.database,
    );
  }

  private async activateOnboarding(
    transaction: Prisma.TransactionClient,
    invitation: Prisma.InvitationGetPayload<{
      include: {
        institution: true;
        targetRole: true;
        onboardingRecord: { include: { studentDetails: true; employeeDetails: true } };
      };
    }>,
    userId: string,
  ): Promise<{ entityId: string; entityType: "student" | "employee" } | null> {
    if (invitation.invitationType === InvitationType.ADMIN) {
      if (invitation.onboardingRecord || !["ADMISSION_ADMIN", "FINANCE_ADMIN", "PRINCIPAL"].includes(invitation.targetRole!.roleCode)) {
        throw new ApplicationError(409, "INVITATION_CONFIGURATION_INVALID", "Invitation cannot be claimed");
      }
      return null;
    }
    const onboarding = invitation.onboardingRecord;
    if (
      !onboarding ||
      onboarding.institutionId !== invitation.institutionId ||
      onboarding.status !== OnboardingStatus.INVITED
    ) {
      throw new ApplicationError(409, "ONBOARDING_STATE_CONFLICT", "Invitation cannot be claimed");
    }

    let entity: { entityId: string; entityType: "student" | "employee" };
    if (invitation.invitationType === InvitationType.STUDENT) {
      if (
        onboarding.personType !== PersonType.STUDENT ||
        invitation.targetRole!.roleCode !== "STUDENT" ||
        !onboarding.studentDetails
      ) {
        throw new ApplicationError(409, "INVITATION_CONFIGURATION_INVALID", "Invitation cannot be claimed");
      }
      const student = await transaction.student.create({
        data: {
          institutionId: invitation.institutionId,
          userId,
          admissionNumber: onboarding.studentDetails.admissionNumber,
        },
      });
      entity = { entityId: student.studentId, entityType: "student" };
    } else {
      const expectedPersonType =
        invitation.invitationType === InvitationType.TEACHER
          ? PersonType.TEACHER
          : PersonType.STAFF;
      const expectedRole =
        invitation.invitationType === InvitationType.TEACHER ? "TEACHER" : "STAFF";
      if (
        onboarding.personType !== expectedPersonType ||
        invitation.targetRole!.roleCode !== expectedRole ||
        !onboarding.employeeDetails
      ) {
        throw new ApplicationError(409, "INVITATION_CONFIGURATION_INVALID", "Invitation cannot be claimed");
      }
      const employee = await transaction.employee.create({
        data: {
          institutionId: invitation.institutionId,
          userId,
          employeeNumber: onboarding.employeeDetails.employeeNumber,
          employeeType: onboarding.employeeDetails.employeeType,
          designation: onboarding.employeeDetails.designation,
          department: onboarding.employeeDetails.department,
        },
      });
      entity = { entityId: employee.employeeId, entityType: "employee" };
    }
    await transaction.onboardingRecord.update({
      where: { onboardingId: onboarding.onboardingId },
      data: {
        status: OnboardingStatus.CLAIMED,
        claimedByUserId: userId,
      },
    });
    return entity;
  }

  private requireInvitationPermission(
    invitationType: InvitationType,
    actor: InvitationActor,
    operation: "resend" | "revoke",
  ): void {
    const permission =
      invitationType === InvitationType.ADMIN
        ? "ADMIN_CREATE"
        : operation === "resend"
          ? "ADMISSION_INVITE_RESEND"
          : "ADMISSION_INVITE_REVOKE";
    if (!actor.permissionCodes.includes(permission)) {
      throw new ApplicationError(403, "PERMISSION_DENIED", "Permission denied");
    }
  }

  private knownRoles(roles: string[]): RoleCode[] {
    return roles.filter((role): role is RoleCode => ROLE_CODES.includes(role as RoleCode));
  }

  private expiresAt(): Date {
    return new Date(Date.now() + getEnvironment().INVITATION_TTL_HOURS * 3_600_000);
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split("@");
    return `${local?.slice(0, 1) ?? "*"}***@${domain ?? "***"}`;
  }

  private auditContext(actor: InvitationActor) {
    return {
      actorUserId: actor.userId,
      actorMembershipId: actor.membershipId,
      institutionId: actor.institutionId,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    };
  }
}
