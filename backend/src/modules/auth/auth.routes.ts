import { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";

import { parseInput } from "../../common/validation.js";
import { getEnvironment } from "../../config/env.js";
import { database } from "../../database/client.js";
import {
  authenticateRequest,
  authenticatedUserId,
} from "../../middleware/authentication.js";
import { requireTrustedOrigin } from "../../middleware/trusted-origin.js";
import { createMailService } from "../notifications/mail.service.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./auth.schemas.js";
import { AuthService, type SessionMetadata } from "./auth.service.js";

const refreshCookieName = "esquare_refresh";
const refreshCookiePath = "/api/v1/auth";

function metadata(request: FastifyRequest): SessionMetadata {
  return {
    ipAddress: request.ip,
    userAgent: request.headers["user-agent"],
  };
}

function setRefreshCookie(reply: FastifyReply, token: string): void {
  const environment = getEnvironment();
  reply.setCookie(refreshCookieName, token, {
    path: refreshCookiePath,
    httpOnly: true,
    secure: environment.COOKIE_SECURE,
    sameSite: "lax",
    maxAge: environment.REFRESH_TOKEN_TTL_DAYS * 86_400,
  });
}

function clearRefreshCookie(reply: FastifyReply): void {
  const environment = getEnvironment();
  reply.clearCookie(refreshCookieName, {
    path: refreshCookiePath,
    httpOnly: true,
    secure: environment.COOKIE_SECURE,
    sameSite: "lax",
  });
}

export async function registerAuthRoutes(application: FastifyInstance): Promise<void> {
  const service = new AuthService(database, createMailService());

  application.post(
    "/api/v1/auth/register",
    { config: { rateLimit: { max: 5, timeWindow: "1 hour" } } },
    async (request, reply) => {
      const result = await service.register(parseInput(registerSchema, request.body));
      return reply.status(202).send(result);
    },
  );

  application.post(
    "/api/v1/auth/verify-email",
    { config: { rateLimit: { max: 10, timeWindow: "15 minutes" } } },
    async (request, reply) =>
      reply.send(await service.verifyEmail(parseInput(verifyEmailSchema, request.body))),
  );

  application.post(
    "/api/v1/auth/login",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const result = await service.login(parseInput(loginSchema, request.body), metadata(request));
      setRefreshCookie(reply, result.refreshToken);
      return reply.send({ accessToken: result.accessToken, user: result.user });
    },
  );

  application.post(
    "/api/v1/auth/refresh",
    {
      preHandler: requireTrustedOrigin,
      config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    },
    async (request, reply) => {
      const result = await service.refresh(
        request.cookies[refreshCookieName],
        metadata(request),
      );
      setRefreshCookie(reply, result.refreshToken);
      return reply.send({ accessToken: result.accessToken, user: result.user });
    },
  );

  application.post(
    "/api/v1/auth/logout",
    { preHandler: requireTrustedOrigin },
    async (request, reply) => {
      await service.logout(request.cookies[refreshCookieName]);
      clearRefreshCookie(reply);
      return reply.status(204).send();
    },
  );

  application.post(
    "/api/v1/auth/forgot-password",
    { config: { rateLimit: { max: 5, timeWindow: "1 hour" } } },
    async (request, reply) =>
      reply.send(
        await service.forgotPassword(parseInput(forgotPasswordSchema, request.body)),
      ),
  );

  application.post(
    "/api/v1/auth/reset-password",
    { config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } },
    async (request, reply) =>
      reply.send(await service.resetPassword(parseInput(resetPasswordSchema, request.body))),
  );

  application.get(
    "/api/v1/auth/me",
    { preHandler: authenticateRequest },
    async (request, reply) =>
      reply.send({ user: await service.userView(authenticatedUserId(request)) }),
  );
}
