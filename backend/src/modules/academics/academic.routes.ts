import { type FastifyInstance, type FastifyRequest } from "fastify";

import { parseInput } from "../../common/validation.js";
import { database } from "../../database/client.js";
import { authenticateRequest, authenticatedUserId } from "../../middleware/authentication.js";
import {
  institutionAccess,
  requirePermission,
  resolveInstitutionMembership,
} from "../../middleware/tenant-authorization.js";
import type { InstitutionActor } from "../institutions/institution.service.js";
import {
  academicListQuerySchema,
  createAcademicSessionSchema,
  createClassSectionSchema,
} from "./academic.schemas.js";
import { AcademicService } from "./academic.service.js";

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

export async function registerAcademicRoutes(application: FastifyInstance): Promise<void> {
  const service = new AcademicService(database);

  application.post(
    "/api/v1/institutions/:institutionId/academic-sessions",
    {
      preHandler: [
        authenticateRequest,
        resolveInstitutionMembership,
        requirePermission("ACADEMIC_SESSION_MANAGE"),
      ],
    },
    async (request, reply) =>
      reply
        .status(201)
        .send(
          await service.createSession(
            parseInput(createAcademicSessionSchema, request.body),
            actor(request),
          ),
        ),
  );

  application.get(
    "/api/v1/institutions/:institutionId/academic-sessions",
    {
      preHandler: [
        authenticateRequest,
        resolveInstitutionMembership,
        requirePermission("INSTITUTION_VIEW"),
      ],
    },
    async (request, reply) =>
      reply.send(
        await service.listSessions(
          parseInput(academicListQuerySchema, request.query),
          actor(request),
        ),
      ),
  );

  application.post(
    "/api/v1/institutions/:institutionId/class-sections",
    {
      preHandler: [
        authenticateRequest,
        resolveInstitutionMembership,
        requirePermission("CLASS_SECTION_MANAGE"),
      ],
    },
    async (request, reply) =>
      reply
        .status(201)
        .send(
          await service.createClassSection(
            parseInput(createClassSectionSchema, request.body),
            actor(request),
          ),
        ),
  );
}
