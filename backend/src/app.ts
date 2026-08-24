import { randomUUID } from "node:crypto";

import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { Prisma } from "@prisma/client";
import Fastify, { LogController, type FastifyInstance } from "fastify";

import { ApplicationError } from "./common/errors.js";
import { requestContext } from "./common/request-context.js";
import { corsOrigins, getEnvironment } from "./config/env.js";
import { database } from "./database/client.js";
import { authenticationPlugin } from "./middleware/authentication.js";
import { registerAuthRoutes } from "./modules/auth/auth.routes.js";
import { registerInstitutionRequestRoutes } from "./modules/institution-requests/institution-request.routes.js";
import { registerInstitutionRoutes } from "./modules/institutions/institution.routes.js";
import { registerAcademicRoutes } from "./modules/academics/academic.routes.js";
import { registerInvitationRoutes } from "./modules/invitations/invitation.routes.js";
import { registerOnboardingRoutes } from "./modules/onboarding/onboarding.routes.js";
import { registerAuditRoutes } from "./modules/audit/audit.routes.js";

export async function buildApplication(): Promise<FastifyInstance> {
  const environment = getEnvironment();
  const application = Fastify({
    bodyLimit: 1_048_576,
    genReqId: () => randomUUID(),
    logger: {
      level: environment.NODE_ENV === "production" ? "info" : "debug",
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          "request.body.password",
          "request.body.token",
          "request.body.code",
          "response.headers['set-cookie']",
        ],
        censor: "[REDACTED]",
      },
    },
    logController: new LogController({
      disableRequestLogging: environment.NODE_ENV === "test",
    }),
    trustProxy: environment.TRUST_PROXY,
  });

  await application.register(helmet, { global: true });
  await application.register(cors, {
    credentials: true,
    origin: corsOrigins(environment),
  });
  await application.register(cookie);
  await application.register(rateLimit, {
    global: true,
    max: 300,
    timeWindow: "1 minute",
  });
  await application.register(authenticationPlugin);

  application.addHook("onRequest", async (request, reply) => {
    requestContext.enterWith({ requestId: request.id });
    reply.header("x-request-id", request.id);
    if (
      environment.NODE_ENV === "production" &&
      request.protocol !== "https" &&
      !request.url.startsWith("/health/")
    ) {
      throw new ApplicationError(400, "HTTPS_REQUIRED", "HTTPS is required");
    }
  });

  application.get("/health/live", async () => ({ status: "ok" }));
  application.get("/health/ready", async (_request, reply) => {
    await database.$queryRaw`SELECT 1`;
    return reply.send({ status: "ready" });
  });

  await registerAuthRoutes(application);
  await registerInstitutionRequestRoutes(application);
  await registerInstitutionRoutes(application);
  await registerAcademicRoutes(application);
  await registerInvitationRoutes(application);
  await registerOnboardingRoutes(application);
  await registerAuditRoutes(application);

  application.setErrorHandler((error, request, reply) => {
    if (error instanceof ApplicationError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.expose ? error.message : "The request could not be completed",
        },
        requestId: request.id,
      });
    }

    if ((error as { validation?: unknown }).validation) {
      return reply.status(422).send({
        error: { code: "VALIDATION_ERROR", message: "Request validation failed" },
        requestId: request.id,
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const mapping: Record<string, { status: number; code: string; message: string }> = {
        P2002: {
          status: 409,
          code: "RESOURCE_CONFLICT",
          message: "A conflicting record already exists",
        },
        P2003: {
          status: 422,
          code: "INVALID_REFERENCE",
          message: "A referenced record is invalid",
        },
        P2025: {
          status: 404,
          code: "RESOURCE_NOT_FOUND",
          message: "Resource not found",
        },
        P2034: {
          status: 409,
          code: "TRANSACTION_CONFLICT",
          message: "The request conflicted with another update",
        },
      };
      const response = mapping[error.code];
      if (response) {
        return reply.status(response.status).send({
          error: { code: response.code, message: response.message },
          requestId: request.id,
        });
      }
    }

    request.log.error({ error }, "Unhandled request error");
    return reply.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message:
          environment.NODE_ENV === "production"
            ? "The request could not be completed"
            : error instanceof Error
              ? error.message
              : "Unknown error",
      },
      requestId: request.id,
    });
  });

  application.addHook("onClose", async () => {
    await database.$disconnect();
  });

  return application;
}
