import { type FastifyInstance, type FastifyRequest } from "fastify";

import { parseInput } from "../../common/validation.js";
import { withTenantTransaction } from "../../database/authorized-transaction.js";
import { authenticateRequest, authenticatedUserId } from "../../middleware/authentication.js";
import {
  institutionAccess,
  requirePermission,
  resolveInstitutionMembership,
} from "../../middleware/tenant-authorization.js";
import { auditListQuerySchema } from "./audit.schemas.js";

function actor(request: FastifyRequest) {
  const access = institutionAccess(request);
  return { userId: authenticatedUserId(request), institutionId: access.institutionId };
}

export async function registerAuditRoutes(application: FastifyInstance): Promise<void> {
  application.get(
    "/api/v1/institutions/:institutionId/audit",
    {
      preHandler: [
        authenticateRequest,
        resolveInstitutionMembership,
        requirePermission("AUDIT_VIEW"),
      ],
    },
    async (request, reply) => {
      const query = parseInput(auditListQuerySchema, request.query);
      const context = actor(request);
      const page = await withTenantTransaction(context, async (transaction) => {
        const rows = await transaction.auditLog.findMany({
          where: {
            institutionId: context.institutionId,
            ...(query.action ? { action: query.action } : {}),
            ...(query.entityType ? { entityType: query.entityType } : {}),
          },
          take: query.limit + 1,
          ...(query.cursor ? { cursor: { auditId: query.cursor }, skip: 1 } : {}),
          orderBy: [{ createdAt: query.direction }, { auditId: query.direction }],
          select: {
            auditId: true,
            actorUserId: true,
            actorMembershipId: true,
            action: true,
            entityType: true,
            entityId: true,
            metadata: true,
            createdAt: true,
          },
        });
        const hasMore = rows.length > query.limit;
        const items = hasMore ? rows.slice(0, query.limit) : rows;
        return {
          items,
          nextCursor: hasMore ? items.at(-1)?.auditId ?? null : null,
        };
      });
      return reply.send(page);
    },
  );
}
