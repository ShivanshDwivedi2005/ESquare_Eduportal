import { type FastifyInstance, type FastifyRequest } from "fastify";

import { parseInput } from "../../common/validation.js";
import { database } from "../../database/client.js";
import {
  authenticateRequest,
  authenticatedUserId,
} from "../../middleware/authentication.js";
import {
  institutionAccess,
  requirePermission,
  resolveInstitutionMembership,
} from "../../middleware/tenant-authorization.js";
import {
  institutionMemberParamsSchema,
  institutionParamsSchema,
  memberListQuerySchema,
  updateMemberRolesSchema,
} from "./institution.schemas.js";
import {
  InstitutionService,
  type InstitutionActor,
} from "./institution.service.js";

function actor(request: FastifyRequest): InstitutionActor {
  const access = institutionAccess(request);
  return {
    userId: authenticatedUserId(request),
    institutionId: access.institutionId,
    membershipId: access.membershipId,
    roleCodes: access.roleCodes,
    ipAddress: request.ip,
    userAgent: request.headers["user-agent"],
  };
}

export async function registerInstitutionRoutes(
  application: FastifyInstance,
): Promise<void> {
  const service = new InstitutionService(database);

  application.get(
    "/api/v1/institutions/:institutionId",
    {
      preHandler: [
        authenticateRequest,
        resolveInstitutionMembership,
        requirePermission("INSTITUTION_VIEW"),
      ],
    },
    async (request, reply) => {
      parseInput(institutionParamsSchema, request.params);
      return reply.send(await service.view(actor(request)));
    },
  );

  application.get(
    "/api/v1/institutions/:institutionId/admins",
    {
      preHandler: [
        authenticateRequest,
        resolveInstitutionMembership,
        requirePermission("ADMIN_VIEW"),
      ],
    },
    async (request, reply) => {
      parseInput(institutionParamsSchema, request.params);
      const query = parseInput(memberListQuerySchema, request.query);
      return reply.send(
        await service.listAdmins(actor(request), query.limit, query.cursor),
      );
    },
  );

  application.patch(
    "/api/v1/institutions/:institutionId/members/:membershipId/roles",
    {
      preHandler: [
        authenticateRequest,
        resolveInstitutionMembership,
        requirePermission("ADMIN_ASSIGN_ROLE"),
      ],
    },
    async (request, reply) => {
      const { membershipId } = parseInput(institutionMemberParamsSchema, request.params);
      const input = parseInput(updateMemberRolesSchema, request.body);
      return reply.send(
        await service.updateRoles(membershipId, input.add, input.remove, actor(request)),
      );
    },
  );

  application.post(
    "/api/v1/institutions/:institutionId/members/:membershipId/suspend",
    {
      preHandler: [
        authenticateRequest,
        resolveInstitutionMembership,
        requirePermission("ADMIN_DISABLE"),
      ],
    },
    async (request, reply) => {
      const { membershipId } = parseInput(institutionMemberParamsSchema, request.params);
      return reply.send(await service.suspend(membershipId, actor(request)));
    },
  );
}
