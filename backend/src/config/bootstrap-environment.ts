import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadDotenv } from "dotenv";

const applicationSchema = "public";

function firstDefined(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => value !== undefined && value.trim() !== "")?.trim();
}

function derivedSecret(source: string, purpose: "access" | "refresh"): string {
  return createHash("sha256")
    .update(`esquare:${purpose}:${source}`, "utf8")
    .digest("hex");
}

function directDatabaseUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  url.hostname = url.hostname.replace("-pooler.", ".");
  if (!url.searchParams.has("schema")) url.searchParams.set("schema", applicationSchema);
  return url.toString();
}

function applicationDatabaseUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  if (!url.searchParams.has("schema")) url.searchParams.set("schema", applicationSchema);
  return url.toString();
}

export function normalizeProjectEnvironment(
  input: NodeJS.ProcessEnv,
): NodeJS.ProcessEnv {
  const output = { ...input };
  const legacyJwtSecret = firstDefined(output.JWT_SECRET);
  const databaseUrl = firstDefined(output.DATABASE_URL);
  const smtpEmail = firstDefined(output.SMTP_EMAIL);

  if (databaseUrl) {
    output.DATABASE_URL = applicationDatabaseUrl(databaseUrl);
    output.DIRECT_DATABASE_URL = firstDefined(output.DIRECT_DATABASE_URL)
      ? applicationDatabaseUrl(output.DIRECT_DATABASE_URL!)
      : directDatabaseUrl(databaseUrl);
  }

  if (!firstDefined(output.JWT_ACCESS_SECRET) && legacyJwtSecret) {
    output.JWT_ACCESS_SECRET = derivedSecret(legacyJwtSecret, "access");
  }
  if (!firstDefined(output.JWT_REFRESH_SECRET) && legacyJwtSecret) {
    output.JWT_REFRESH_SECRET = derivedSecret(legacyJwtSecret, "refresh");
  }

  output.ACCESS_TOKEN_TTL_MINUTES = firstDefined(
    output.ACCESS_TOKEN_TTL_MINUTES,
    output.JWT_EXPIRE_MINUTES,
  );

  output.CORS_ORIGINS = firstDefined(
    output.CORS_ORIGINS,
    "http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173,http://127.0.0.1:5173",
  );
  output.APP_BASE_URL = firstDefined(output.APP_BASE_URL, "http://localhost:8080");

  if (smtpEmail && firstDefined(output.SMTP_PASSWORD)) {
    output.SMTP_HOST = firstDefined(output.SMTP_HOST, "smtp.gmail.com");
    output.SMTP_PORT = firstDefined(output.SMTP_PORT, "587");
    output.SMTP_USER = firstDefined(output.SMTP_USER, smtpEmail);
    output.SMTP_FROM = firstDefined(output.SMTP_FROM, smtpEmail);
  }

  return output;
}

function rootEnvironmentCandidates(): string[] {
  const moduleDirectory = dirname(fileURLToPath(import.meta.url));
  return [
    resolve(moduleDirectory, "../../../.env"),
    resolve(moduleDirectory, "../../../../.env"),
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "../.env"),
  ];
}

let loaded = false;

export function loadProjectEnvironment(): void {
  if (loaded) return;
  loaded = true;

  const rootEnvironment = rootEnvironmentCandidates().find((candidate) =>
    existsSync(candidate),
  );
  if (rootEnvironment) {
    loadDotenv({ path: rootEnvironment, override: false, quiet: true });
  }

  Object.assign(process.env, normalizeProjectEnvironment(process.env));
}
