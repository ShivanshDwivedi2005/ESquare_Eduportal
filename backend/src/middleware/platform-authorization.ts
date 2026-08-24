import { PlatformRole } from "@prisma/client";
import { type FastifyRequest } from "fastify";

import { ApplicationError } from "../common/errors.js";
import { database } from "../database/client.js";
import { authenticatedUserId } from "./authentication.js";

export function requirePlatformRole(allowedRoles: readonly PlatformRole[]) {
  return async function platformAuthorization(request: FastifyRequest): Promise<void> {
    const userId = authenticatedUserId(request);
    const assignments = await database.platformUserRole.findMany({
      where: { userId, role: { in: [...allowedRoles] } },
      select: { role: true },
    });
    if (assignments.length === 0) {
      throw new ApplicationError(403, "PLATFORM_PERMISSION_DENIED", "Permission denied");
    }
    request.platformRoles = assignments.map(({ role }) => role);
  };
}
