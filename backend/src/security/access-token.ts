import { jwtVerify, SignJWT } from "jose";

import { getEnvironment } from "../config/env.js";

const issuer = "esquare-api";
const audience = "esquare-web";

export async function createAccessToken(userId: string): Promise<string> {
  const environment = getEnvironment();
  return new SignJWT({ tokenType: "access" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(`${environment.ACCESS_TOKEN_TTL_MINUTES}m`)
    .sign(new TextEncoder().encode(environment.JWT_ACCESS_SECRET));
}

export async function verifyAccessToken(token: string): Promise<string | null> {
  try {
    const environment = getEnvironment();
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(environment.JWT_ACCESS_SECRET),
      { algorithms: ["HS256"], audience, issuer },
    );
    if (payload.tokenType !== "access" || typeof payload.sub !== "string") return null;
    return payload.sub;
  } catch {
    return null;
  }
}
