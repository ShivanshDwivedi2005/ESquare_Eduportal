import { InstitutionType, RegistrationRequestStatus } from "@prisma/client";
import { z } from "zod";

export const createInstitutionRequestSchema = z
  .object({
    institutionName: z.string().trim().min(2).max(250),
    institutionType: z.enum(InstitutionType),
    boardId: z.uuid().optional(),
    registrationNumber: z.string().trim().min(2).max(100).optional(),
    officialEmail: z.string().trim().toLowerCase().email().max(254),
    officialPhone: z.string().regex(/^\+[1-9]\d{7,14}$/),
    addressLine1: z.string().trim().min(3).max(250),
    addressLine2: z.string().trim().min(1).max(250).optional(),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100),
    postalCode: z.string().trim().min(3).max(20),
    country: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/),
    proofFileId: z.uuid().optional(),
  })
  .strict();

export const requestIdParamsSchema = z.object({ requestId: z.uuid() }).strict();

export const requestListQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(25),
    cursor: z.uuid().optional(),
    status: z.enum(RegistrationRequestStatus).optional(),
    sort: z.enum(["createdAt"]).default("createdAt"),
    direction: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export const rejectInstitutionRequestSchema = z
  .object({ rejectionReason: z.string().trim().min(10).max(1000) })
  .strict();

export type CreateInstitutionRequestInput = z.infer<
  typeof createInstitutionRequestSchema
>;
export type RequestListQuery = z.infer<typeof requestListQuerySchema>;
