import { InvitationStatus, InvitationType } from "@prisma/client";
import { z } from "zod";

export const adminInvitationSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    targetRole: z.enum(["ADMISSION_ADMIN", "FINANCE_ADMIN", "PRINCIPAL"]),
  })
  .strict();

export const invitationTokenSchema = z
  .object({ token: z.string().min(40).max(100) })
  .strict();

export const invitationParamsSchema = z
  .object({ institutionId: z.uuid(), invitationId: z.uuid() })
  .strict();

export const invitationListQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(25),
    cursor: z.uuid().optional(),
    status: z.enum(InvitationStatus).optional(),
    type: z.enum(InvitationType).optional(),
  })
  .strict();
