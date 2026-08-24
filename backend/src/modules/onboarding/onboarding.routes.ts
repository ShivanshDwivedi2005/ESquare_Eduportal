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
import type { InstitutionActor } from "../institutions/institution.service.js";
import { createMailService } from "../notifications/mail.service.js";
import {
  onboardingListQuerySchema,
  staffOnboardingSchema,
  studentOnboardingSchema,
  teacherOnboardingSchema,
} from "./onboarding.schemas.js";
import { OnboardingService } from "./onboarding.service.js";

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

export async function registerOnboardingRoutes(application: FastifyInstance): Promise<void> {
  const service = new OnboardingService(database, createMailService());

  application.post(
    "/api/v1/institutions/:institutionId/onboarding/students",
    {
      preHandler: [
        authenticateRequest,
        resolveInstitutionMembership,
        requirePermission("STUDENT_CREATE"),
      ],
    },
    async (request, reply) =>
      reply
        .status(201)
        .send(
          await service.createStudent(
            parseInput(studentOnboardingSchema, request.body),
            actor(request),
          ),
        ),
  );

  application.post(
    "/api/v1/institutions/:institutionId/onboarding/teachers",
    {
      preHandler: [
        authenticateRequest,
        resolveInstitutionMembership,
        requirePermission("TEACHER_CREATE"),
      ],
    },
    async (request, reply) =>
      reply
        .status(201)
        .send(
          await service.createTeacher(
            parseInput(teacherOnboardingSchema, request.body),
            actor(request),
          ),
        ),
  );

  application.post(
    "/api/v1/institutions/:institutionId/onboarding/staff",
    {
      preHandler: [
        authenticateRequest,
        resolveInstitutionMembership,
        requirePermission("STAFF_CREATE"),
      ],
    },
    async (request, reply) =>
      reply
        .status(201)
        .send(
          await service.createStaff(
            parseInput(staffOnboardingSchema, request.body),
            actor(request),
          ),
        ),
  );

  application.get(
    "/api/v1/institutions/:institutionId/onboarding",
    {
      preHandler: [
        authenticateRequest,
        resolveInstitutionMembership,
        requireAnyPermission(["STUDENT_VIEW", "TEACHER_VIEW", "STAFF_VIEW"]),
      ],
    },
    async (request, reply) =>
      reply.send(
        await service.list(
          parseInput(onboardingListQuerySchema, request.query),
          actor(request),
        ),
      ),
  );
}
