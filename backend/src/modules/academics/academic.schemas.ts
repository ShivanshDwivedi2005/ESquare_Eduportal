import { AcademicStatus } from "@prisma/client";
import { z } from "zod";

const isoDate = z.iso.date().transform((value) => new Date(`${value}T00:00:00.000Z`));

export const createAcademicSessionSchema = z
  .object({
    name: z.string().trim().min(2).max(50),
    startDate: isoDate,
    endDate: isoDate,
    status: z.enum(AcademicStatus).default(AcademicStatus.DRAFT),
  })
  .strict()
  .refine((value) => value.endDate > value.startDate, "End date must follow start date");

export const createClassSectionSchema = z
  .object({
    academicSessionId: z.uuid(),
    classLevel: z.string().trim().min(1).max(50),
    section: z.string().trim().min(1).max(20),
    stream: z.string().trim().min(1).max(100).optional(),
    status: z.enum(AcademicStatus).default(AcademicStatus.ACTIVE),
  })
  .strict();

export const academicListQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    cursor: z.uuid().optional(),
    status: z.enum(AcademicStatus).optional(),
  })
  .strict();
