import { type PrismaClient } from "@prisma/client";

import { ApplicationError } from "../../common/errors.js";
import { withTenantTransaction } from "../../database/authorized-transaction.js";
import {
  mayAssignRole,
  ROLE_CODES,
  type RoleCode,
} from "../../security/authorization-catalog.js";
import { writeAuditLog } from "../audit/audit.service.js";

export interface InstitutionActor {
  userId: string;
  institutionId: string;
  membershipId: string;
  roleCodes: string[];
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

export class InstitutionService {
  public constructor(private readonly database: PrismaClient) {}

  public async view(actor: InstitutionActor): Promise<object> {
    return withTenantTransaction(actor, async (transaction) => {
      const institution = await transaction.institution.findFirst({
        where: { institutionId: actor.institutionId, status: "ACTIVE" },
        select: {
          institutionId: true,
          institutionCode: true,
          institutionName: true,
          institutionType: true,
          board: { select: { boardCode: true, displayName: true } },
          status: true,
          createdAt: true,
        },
      });
      if (!institution) {
        throw new ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found");
      }
      return institution;
    }, this.database);
  }

  public async listAdmins(
    actor: InstitutionActor,
    limit: number,
    cursor?: string,
  ): Promise<object> {
    return withTenantTransaction(actor, async (transaction) => {
      const adminRoles: RoleCode[] = [
        "ROOT_ADMIN",
        "ADMISSION_ADMIN",
        "FINANCE_ADMIN",
        "PRINCIPAL",
      ];
      const rows = await transaction.institutionMembership.findMany({
        where: {
          institutionId: actor.institutionId,
          roles: { some: { role: { roleCode: { in: adminRoles } } } },
        },
        take: limit + 1,
        ...(cursor ? { cursor: { membershipId: cursor }, skip: 1 } : {}),
        orderBy: [{ joinedAt: "asc" }, { membershipId: "asc" }],
        select: {
          membershipId: true,
          status: true,
          joinedAt: true,
          leftAt: true,
          user: {
            select: {
              userId: true,
              email: true,
              phone: true,
              profile: {
                select: { firstName: true, middleName: true, lastName: true },
              },
            },
          },
          roles: { select: { role: { select: { roleCode: true, displayName: true } } } },
        },
      });
      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;
      return {
        items,
        nextCursor: hasMore ? items.at(-1)?.membershipId ?? null : null,
      };
    }, this.database);
  }

  public async updateRoles(
    targetMembershipId: string,
    add: RoleCode[],
    remove: RoleCode[],
    actor: InstitutionActor,
  ): Promise<object> {
    const actorRoles = actor.roleCodes.filter((role): role is RoleCode =>
      ROLE_CODES.includes(role as RoleCode),
    );
    for (const targetRole of [...add, ...remove]) {
      if (!mayAssignRole(actorRoles, targetRole)) {
        throw new ApplicationError(403, "ROLE_ASSIGNMENT_DENIED", "Role cannot be assigned");
      }
    }

    return withTenantTransaction(actor, async (transaction) => {
      const target = await transaction.institutionMembership.findFirst({
        where: {
          membershipId: targetMembershipId,
          institutionId: actor.institutionId,
          status: { in: ["PENDING", "ACTIVE", "SUSPENDED"] },
        },
      });
      if (!target) throw new ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found");

      const requestedCodes = [...new Set([...add, ...remove])];
      const roles = await transaction.role.findMany({
        where: { roleCode: { in: requestedCodes } },
      });
      if (roles.length !== requestedCodes.length) {
        throw new ApplicationError(422, "UNKNOWN_ROLE", "Request validation failed");
      }
      const roleByCode = new Map(roles.map((role) => [role.roleCode, role]));

      if (add.length > 0) {
        await transaction.membershipRole.createMany({
          data: add.map((roleCode) => ({
            membershipId: targetMembershipId,
            roleId: roleByCode.get(roleCode)!.roleId,
            assignedByMembershipId: actor.membershipId,
          })),
          skipDuplicates: true,
        });
      }
      if (remove.length > 0) {
        await transaction.membershipRole.deleteMany({
          where: {
            membershipId: targetMembershipId,
            roleId: { in: remove.map((roleCode) => roleByCode.get(roleCode)!.roleId) },
          },
        });
      }
      for (const roleCode of add) {
        await writeAuditLog(
          transaction,
          this.auditContext(actor),
          {
            action: "admin.role.assigned",
            entityType: "institution_membership",
            entityId: targetMembershipId,
            metadata: { roleCode },
          },
        );
      }
      for (const roleCode of remove) {
        await writeAuditLog(
          transaction,
          this.auditContext(actor),
          {
            action: "admin.role.removed",
            entityType: "institution_membership",
            entityId: targetMembershipId,
            metadata: { roleCode },
          },
        );
      }
      const updated = await transaction.institutionMembership.findFirst({
        where: { membershipId: targetMembershipId, institutionId: actor.institutionId },
        select: {
          membershipId: true,
          status: true,
          roles: { select: { role: { select: { roleCode: true, displayName: true } } } },
        },
      });
      if (!updated) throw new ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found");
      return updated;
    }, this.database);
  }

  public async suspend(
    targetMembershipId: string,
    actor: InstitutionActor,
  ): Promise<object> {
    if (targetMembershipId === actor.membershipId) {
      throw new ApplicationError(409, "SELF_SUSPENSION_DENIED", "You cannot suspend yourself");
    }
    return withTenantTransaction(actor, async (transaction) => {
      const target = await transaction.institutionMembership.findFirst({
        where: {
          membershipId: targetMembershipId,
          institutionId: actor.institutionId,
          status: "ACTIVE",
        },
        include: { roles: { include: { role: true } } },
      });
      if (!target) throw new ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found");
      if (target.roles.some(({ role }) => role.roleCode === "ROOT_ADMIN")) {
        throw new ApplicationError(409, "ROOT_ADMIN_PROTECTED", "Root administrator cannot be suspended");
      }
      const updated = await transaction.institutionMembership.update({
        where: { membershipId: targetMembershipId },
        data: { status: "SUSPENDED" },
        select: { membershipId: true, status: true, updatedAt: true },
      });
      await writeAuditLog(
        transaction,
        this.auditContext(actor),
        {
          action: "admin.suspended",
          entityType: "institution_membership",
          entityId: targetMembershipId,
        },
      );
      return updated;
    }, this.database);
  }

  private auditContext(actor: InstitutionActor) {
    return {
      actorUserId: actor.userId,
      actorMembershipId: actor.membershipId,
      institutionId: actor.institutionId,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    };
  }
}
