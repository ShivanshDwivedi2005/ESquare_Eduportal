import { UserStatus } from "@prisma/client";
import fp from "fastify-plugin";
import { type FastifyRequest } from "fastify";
import { z } from "zod";

import { ApplicationError } from "../common/errors.js";
import { requestContext } from "../common/request-context.js";
import { database } from "../database/client.js";
import { verifyAccessToken } from "../security/access-token.js";

export const authenticationPlugin = fp(async (application) => {
  application.decorateRequest("authUser", null);
  application.decorateRequest("institutionAccess", null);
  application.decorateRequest("platformRoles", null);
});

export async function authenticateRequest(request: FastifyRequest): Promise<void> {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    throw new ApplicationError(401, "AUTHENTICATION_REQUIRED", "Sign in required");
  }
  const subject = await verifyAccessToken(authorization.slice(7));
  const parsedId = z.uuid().safeParse(subject);
  if (!parsedId.success) {
    throw new ApplicationError(401, "INVALID_ACCESS_TOKEN", "Sign in required");
  }
  const user = await database.user.findUnique({
    where: { userId: parsedId.data },
    select: { userId: true, status: true, emailVerifiedAt: true },
  });
  if (!user || user.status !== UserStatus.ACTIVE || !user.emailVerifiedAt) {
    throw new ApplicationError(401, "INVALID_ACCESS_TOKEN", "Sign in required");
  }
  request.authUser = { userId: user.userId };
  const context = requestContext.getStore();
  if (context) context.userId = user.userId;
}

export function authenticatedUserId(request: FastifyRequest): string {
  if (!request.authUser) {
    throw new ApplicationError(401, "AUTHENTICATION_REQUIRED", "Sign in required");
  }
  return request.authUser.userId;
}
