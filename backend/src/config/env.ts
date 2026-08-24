import { z } from "zod";

const booleanFromString = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

const postgresUrl = z.string().min(1).refine(
  (value) => /^postgres(?:ql)?:\/\//i.test(value),
  "A PostgreSQL connection string is required",
);

export const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(8000),
  DATABASE_URL: postgresUrl,
  DIRECT_DATABASE_URL: postgresUrl.optional(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().min(5).max(60).default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  INVITATION_TTL_HOURS: z.coerce.number().int().min(1).max(168).default(72),
  EMAIL_VERIFICATION_TTL_MINUTES: z.coerce.number().int().min(5).max(60).default(15),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().min(5).max(60).default(30),
  CORS_ORIGINS: z.string().min(1),
  COOKIE_SECURE: booleanFromString.default(false),
  TRUST_PROXY: booleanFromString.default(false),
  APP_BASE_URL: z.string().url(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65_535).default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
}).superRefine((environment, context) => {
  const origins = environment.CORS_ORIGINS.split(",").map((origin) => origin.trim());
  if (origins.includes("*")) {
    context.addIssue({ code: "custom", path: ["CORS_ORIGINS"], message: "Wildcard CORS is forbidden" });
  }
  if (environment.JWT_ACCESS_SECRET === environment.JWT_REFRESH_SECRET) {
    context.addIssue({
      code: "custom",
      path: ["JWT_REFRESH_SECRET"],
      message: "Access and refresh secrets must differ",
    });
  }
  if (environment.NODE_ENV === "production") {
    if (!environment.COOKIE_SECURE) {
      context.addIssue({ code: "custom", path: ["COOKIE_SECURE"], message: "Secure cookies are required" });
    }
    if (!environment.DIRECT_DATABASE_URL) {
      context.addIssue({ code: "custom", path: ["DIRECT_DATABASE_URL"], message: "Direct migration URL is required" });
    }
    if (!environment.APP_BASE_URL.startsWith("https://")) {
      context.addIssue({ code: "custom", path: ["APP_BASE_URL"], message: "HTTPS application URL is required" });
    }
    for (const [key, value] of [
      ["DATABASE_URL", environment.DATABASE_URL],
      ["DIRECT_DATABASE_URL", environment.DIRECT_DATABASE_URL],
    ] as const) {
      if (value && !/[?&]sslmode=(?:require|verify-ca|verify-full)(?:&|$)/i.test(value)) {
        context.addIssue({ code: "custom", path: [key], message: "PostgreSQL TLS is required" });
      }
    }
  }
});

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(input: NodeJS.ProcessEnv): Environment {
  return environmentSchema.parse(input);
}

let cachedEnvironment: Environment | undefined;

export function getEnvironment(): Environment {
  cachedEnvironment ??= validateEnvironment(process.env);
  return cachedEnvironment;
}

export function corsOrigins(environment: Environment): string[] {
  return environment.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
