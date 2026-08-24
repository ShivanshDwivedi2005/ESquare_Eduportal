import { z } from "zod";

import { ROLE_CODES } from "../../security/authorization-catalog.js";

export const institutionParamsSchema = z.object({ institutionId: z.uuid() }).strict();

export const institutionMemberParamsSchema = z
  .object({ institutionId: z.uuid(), membershipId: z.uuid() })
  .strict();

export const memberListQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(25),
    cursor: z.uuid().optional(),
  })
  .strict();

export const updateMemberRolesSchema = z
  .object({
    add: z.array(z.enum(ROLE_CODES)).max(3).default([]),
    remove: z.array(z.enum(ROLE_CODES)).max(3).default([]),
  })
  .strict()
  .refine((value) => value.add.length + value.remove.length > 0)
  .refine(
    (value) => !value.add.some((role) => value.remove.includes(role)),
    "A role cannot be added and removed together",
  );
