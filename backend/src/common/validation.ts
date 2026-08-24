import { type ZodType } from "zod";

import { ApplicationError } from "./errors.js";

export function parseInput<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ApplicationError(422, "VALIDATION_ERROR", "Request validation failed");
  }
  return result.data;
}
