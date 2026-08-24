import { type FastifyInstance, type FastifyRequest } from "fastify";

import { parseInput } from "../../common/validation.js";
import { database } from "../../database/client.js";
import { authenticateRequest, authenticatedUserId } from "../../middleware/authentication.js";
import {
  institutionAccess,
  requireAnyPermission,
  requirePermission,
  resolveInstitutionMembership,
} from "../../middleware/tenant-authorization.js";
import { createMailService } from "../notifications/mail.service.js";
import {
  adminInvitationSchema,
  invitationListQuerySchema,
  invitationParamsSchema,
  invitationTokenSchema,
} from "./invitation.schemas.js";
import { InvitationService, type InvitationActor } from "./invitation.service.js";

function actor(request: FastifyRequest): InvitationActor {
  const access = institutionAccess(request);
  return {
    userId: authenticatedUserId(request),
    institutionId: access.institutionId,
    membershipId: access.membershipId,
    roleCodes: access.roleCodes,
    permissionCodes: access.permissionCodes,
    ipAddress: request.ip,
    userAgent: request.headers["user-agent"],
  };
}

export async function registerInvitationRoutes(application: FastifyInstance): Promise<void> {
  const service = new InvitationService(database, createMailService());

  application.post(
    "/api/v1/institutions/:institutionId/admin-invitations",
    {
      preHandler: [
        authenticateRequest,
        resolveInstitutionMembership,
        requirePermission("ADMIN_CREATE"),
      ],
    },
    async (request, reply) => {
      const input = parseInput(adminInvitationSchema, request.body);
      return reply
        .status(201)
        .send(
          await service.createAdminInvitation(
            input.email,
            input.targetRole,
            actor(request),
          ),
        );
    },
  );

  application.get(
    "/api/v1/institutions/:institutionId/invitations",
    {
      preHandler: [
        authenticateRequest,
        resolveInstitutionMembership,
        requireAnyPermission(["ADMIN_VIEW", "ADMISSION_INVITE_RESEND"]),
      ],
    },
    async (request, reply) =>
      reply.send(
        await service.list(
          actor(request),
          parseInput(invitationListQuerySchema, request.query),
        ),
      ),
  );

  application.post(
    "/api/v1/institutions/:institutionId/invitations/:invitationId/resend",
    {
      preHandler: [
        authenticateRequest,
        resolveInstitutionMembership,
        requireAnyPermission(["ADMIN_CREATE", "ADMISSION_INVITE_RESEND"]),
      ],
    },
    async (request, reply) => {
      const { invitationId } = parseInput(invitationParamsSchema, request.params);
      return reply.send(await service.resend(invitationId, actor(request)));
    },
  );

  application.post(
    "/api/v1/institutions/:institutionId/invitations/:invitationId/revoke",
    {
      preHandler: [
        authenticateRequest,
        resolveInstitutionMembership,
        requireAnyPermission(["ADMIN_CREATE", "ADMISSION_INVITE_REVOKE"]),
      ],
    },
    async (request, reply) => {
      const { invitationId } = parseInput(invitationParamsSchema, request.params);
      return reply.send(await service.revoke(invitationId, actor(request)));
    },
  );

  application.post(
    "/api/v1/invitations/validate",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const { token } = parseInput(invitationTokenSchema, request.body);
      return reply.send(await service.validate(token));
    },
  );

  application.post(
    "/api/v1/invitations/accept",
    {
      preHandler: authenticateRequest,
      config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    },
    async (request, reply) => {
      const { token } = parseInput(invitationTokenSchema, request.body);
      return reply.send(await service.accept(token, authenticatedUserId(request)));
    },
  );
}
