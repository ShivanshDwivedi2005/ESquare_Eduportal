import { type FastifyRequest } from "fastify";
import { z } from "zod";

import { ApplicationError } from "../common/errors.js";
import { requestContext } from "../common/request-context.js";
import { database } from "../database/client.js";
import { withTenantTransaction } from "../database/authorized-transaction.js";
import type { PermissionCode } from "../security/authorization-catalog.js";
import { writeAuditLog } from "../modules/audit/audit.service.js";
import { authenticatedUserId } from "./authentication.js";

const institutionParamsSchema = z.object({ institutionId: z.uuid() }).passthrough();

export async function resolveInstitutionMembership(request: FastifyRequest): Promise<void> {
  const params = institutionParamsSchema.safeParse(request.params);
  if (!params.success) {
    throw new ApplicationError(422, "VALIDATION_ERROR", "Request validation failed");
  }
  const userId = authenticatedUserId(request);
  const membership = await database.institutionMembership.findFirst({
    where: {
      userId,
      institutionId: params.data.institutionId,
      status: "ACTIVE",
      institution: { status: "ACTIVE" },
    },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      },
    },
  });
  if (!membership) {
    throw new ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found");
  }

  const roleCodes = membership.roles.map(({ role }) => role.roleCode);
  const permissionCodes = [
    ...new Set(
      membership.roles.flatMap(({ role }) =>
        role.permissions.map(({ permission }) => permission.permissionCode),
      ),
    ),
  ];
  request.institutionAccess = {
    institutionId: membership.institutionId,
    membershipId: membership.membershipId,
    roleCodes,
    permissionCodes,
  };
  const context = requestContext.getStore();
  if (context) {
    context.institutionId = membership.institutionId;
    context.membershipId = membership.membershipId;
  }
}

async function recordPermissionDenial(
  request: FastifyRequest,
  permissions: readonly PermissionCode[],
): Promise<void> {
  const access = request.institutionAccess;
  if (!access || !request.authUser) return;
  try {
    await withTenantTransaction(
      { userId: request.authUser.userId, institutionId: access.institutionId },
      (transaction) =>
        writeAuditLog(
          transaction,
          {
            actorUserId: request.authUser!.userId,
            actorMembershipId: access.membershipId,
            institutionId: access.institutionId,
            ipAddress: request.ip,
            userAgent: request.headers["user-agent"],
          },
          {
            action: "permission.denied",
            entityType: "institution",
            entityId: access.institutionId,
            metadata: { permissions },
          },
        ),
    );
  } catch (error) {
    request.log.error({ error, permissions }, "Failed to persist permission denial audit");
  }
}

export function requirePermission(permission: PermissionCode) {
  return async function permissionAuthorization(request: FastifyRequest): Promise<void> {
    const access = request.institutionAccess;
    if (access?.permissionCodes.includes(permission)) return;

    await recordPermissionDenial(request, [permission]);
    throw new ApplicationError(403, "PERMISSION_DENIED", "Permission denied");
  };
}

export function requireAnyPermission(permissions: readonly PermissionCode[]) {
  return async function anyPermissionAuthorization(request: FastifyRequest): Promise<void> {
    const access = request.institutionAccess;
    if (access && permissions.some((permission) => access.permissionCodes.includes(permission))) {
      return;
    }
    await recordPermissionDenial(request, permissions);
    throw new ApplicationError(403, "PERMISSION_DENIED", "Permission denied");
  };
}

export function institutionAccess(request: FastifyRequest) {
  if (!request.institutionAccess) {
    throw new ApplicationError(403, "PERMISSION_DENIED", "Permission denied");
  }
  return request.institutionAccess;
}
