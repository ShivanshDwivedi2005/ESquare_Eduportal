import { randomUUID } from "node:crypto";

import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";

import { ApplicationError } from "./common/errors.js";
import { requestContext } from "./common/request-context.js";
import { corsOrigins, getEnvironment } from "./config/env.js";
import { database } from "./database/client.js";
import { authenticationPlugin } from "./middleware/authentication.js";
import { registerAuthRoutes } from "./modules/auth/auth.routes.js";

export async function buildApplication(): Promise<FastifyInstance> {
  const environment = getEnvironment();
  const application = Fastify({
    bodyLimit: 1_048_576,
    disableRequestLogging: environment.NODE_ENV === "test",
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
  });

  application.get("/health/live", async () => ({ status: "ok" }));
  application.get("/health/ready", async (_request, reply) => {
    await database.$queryRaw`SELECT 1`;
    return reply.send({ status: "ready" });
  });

  await registerAuthRoutes(application);

  application.setErrorHandler((error, request, reply) => {
    if (error instanceof ApplicationError) {
      return reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message },
        requestId: request.id,
      });
    }

    if ((error as { validation?: unknown }).validation) {
      return reply.status(422).send({
        error: { code: "VALIDATION_ERROR", message: "Request validation failed" },
        requestId: request.id,
      });
    }

    request.log.error({ error }, "Unhandled request error");
    return reply.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message:
          environment.NODE_ENV === "production"
            ? "The request could not be completed"
            : error.message,
      },
      requestId: request.id,
    });
  });

  application.addHook("onClose", async () => {
    await database.$disconnect();
  });

  return application;
}
