import { PlatformRole } from "@prisma/client";
import { type FastifyInstance, type FastifyRequest } from "fastify";

import { parseInput } from "../../common/validation.js";
import { database } from "../../database/client.js";
import {
  authenticateRequest,
  authenticatedUserId,
} from "../../middleware/authentication.js";
import { requirePlatformRole } from "../../middleware/platform-authorization.js";
import {
  createInstitutionRequestSchema,
  rejectInstitutionRequestSchema,
  requestIdParamsSchema,
  requestListQuerySchema,
} from "./institution-request.schemas.js";
import {
  InstitutionRequestService,
  type RequestActor,
} from "./institution-request.service.js";

const platformReviewRoles = [
  PlatformRole.PLATFORM_SUPER_ADMIN,
  PlatformRole.PLATFORM_INSTITUTION_REVIEWER,
] as const;

function actor(request: FastifyRequest): RequestActor {
  return {
    userId: authenticatedUserId(request),
    ipAddress: request.ip,
    userAgent: request.headers["user-agent"],
  };
}

export async function registerInstitutionRequestRoutes(
  application: FastifyInstance,
): Promise<void> {
  const service = new InstitutionRequestService(database);

  application.post(
    "/api/v1/institution-requests",
    { preHandler: authenticateRequest },
    async (request, reply) =>
      reply
        .status(201)
        .send(
          await service.create(
            parseInput(createInstitutionRequestSchema, request.body),
            actor(request),
          ),
        ),
  );

  application.get(
    "/api/v1/institution-requests/me",
    { preHandler: authenticateRequest },
    async (request, reply) =>
      reply.send(
        await service.listMine(
          authenticatedUserId(request),
          parseInput(requestListQuerySchema, request.query),
        ),
      ),
  );

  application.get(
    "/api/v1/institution-requests/:requestId",
    { preHandler: authenticateRequest },
    async (request, reply) => {
      const { requestId } = parseInput(requestIdParamsSchema, request.params);
      return reply.send(await service.getMine(authenticatedUserId(request), requestId));
    },
  );

  application.get(
    "/api/v1/platform/institution-requests",
    {
      preHandler: [authenticateRequest, requirePlatformRole(platformReviewRoles)],
    },
    async (request, reply) =>
      reply.send(
        await service.listForPlatform(parseInput(requestListQuerySchema, request.query)),
      ),
  );

  application.get(
    "/api/v1/platform/institution-requests/:requestId",
    {
      preHandler: [authenticateRequest, requirePlatformRole(platformReviewRoles)],
    },
    async (request, reply) => {
      const { requestId } = parseInput(requestIdParamsSchema, request.params);
      return reply.send(await service.getForPlatform(requestId));
    },
  );

  application.post(
    "/api/v1/platform/institution-requests/:requestId/start-review",
    {
      preHandler: [authenticateRequest, requirePlatformRole(platformReviewRoles)],
    },
    async (request, reply) => {
      const { requestId } = parseInput(requestIdParamsSchema, request.params);
      return reply.send(await service.startReview(requestId, actor(request)));
    },
  );

  application.post(
    "/api/v1/platform/institution-requests/:requestId/approve",
    {
      preHandler: [authenticateRequest, requirePlatformRole(platformReviewRoles)],
    },
    async (request, reply) => {
      const { requestId } = parseInput(requestIdParamsSchema, request.params);
      return reply.send(await service.approve(requestId, actor(request)));
    },
  );

  application.post(
    "/api/v1/platform/institution-requests/:requestId/reject",
    {
      preHandler: [authenticateRequest, requirePlatformRole(platformReviewRoles)],
    },
    async (request, reply) => {
      const { requestId } = parseInput(requestIdParamsSchema, request.params);
      const { rejectionReason } = parseInput(
        rejectInstitutionRequestSchema,
        request.body,
      );
      return reply.send(await service.reject(requestId, rejectionReason, actor(request)));
    },
  );
}
