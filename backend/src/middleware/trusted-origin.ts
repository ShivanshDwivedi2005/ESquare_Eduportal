import { type FastifyRequest } from "fastify";

import { ApplicationError } from "../common/errors.js";
import { corsOrigins, getEnvironment } from "../config/env.js";

export async function requireTrustedOrigin(request: FastifyRequest): Promise<void> {
  const origin = request.headers.origin;
  if (!origin || !corsOrigins(getEnvironment()).includes(origin)) {
    throw new ApplicationError(403, "UNTRUSTED_ORIGIN", "Request origin is not allowed");
  }
}
