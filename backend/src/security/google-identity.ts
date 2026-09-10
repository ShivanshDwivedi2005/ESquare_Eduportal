import { createRemoteJWKSet, jwtVerify } from "jose";

import { ApplicationError } from "../common/errors.js";

const googleJwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

export interface VerifiedGoogleIdentity {
  subject: string;
  email: string;
  firstName: string;
  lastName: string;
}

export async function verifyGoogleCredential(
  credential: string,
  clientId: string,
): Promise<VerifiedGoogleIdentity> {
  try {
    const { payload } = await jwtVerify(credential, googleJwks, {
      audience: clientId,
      issuer: ["accounts.google.com", "https://accounts.google.com"],
      algorithms: ["RS256"],
    });
    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      payload.email_verified !== true
    ) {
      throw new Error("Google identity is missing a verified email");
    }

    const fallbackName = payload.email.split("@")[0] || "Google";
    const firstName =
      typeof payload.given_name === "string" && payload.given_name.trim()
        ? payload.given_name.trim().slice(0, 100)
        : fallbackName.slice(0, 100);
    const lastName =
      typeof payload.family_name === "string" && payload.family_name.trim()
        ? payload.family_name.trim().slice(0, 100)
        : "Account";

    return {
      subject: payload.sub,
      email: payload.email.trim().toLowerCase(),
      firstName,
      lastName,
    };
  } catch {
    throw new ApplicationError(
      401,
      "INVALID_GOOGLE_CREDENTIAL",
      "Google sign-in could not be verified",
    );
  }
}
