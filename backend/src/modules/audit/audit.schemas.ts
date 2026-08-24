import { z } from "zod";

export const auditListQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    cursor: z.uuid().optional(),
    action: z.string().regex(/^[a-z][a-z0-9_.]{1,149}$/).optional(),
    entityType: z.string().regex(/^[a-z][a-z0-9_]{1,99}$/).optional(),
    sort: z.enum(["createdAt"]).default("createdAt"),
    direction: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();
