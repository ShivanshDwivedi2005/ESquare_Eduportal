import { EmployeeType, OnboardingStatus, PersonType } from "@prisma/client";
import { z } from "zod";

const isoDate = z.iso.date().transform((value) => new Date(`${value}T00:00:00.000Z`));
const name = z.string().trim().min(1).max(100);
const common = {
  firstName: name,
  middleName: name.optional(),
  lastName: name,
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/).optional(),
  dateOfBirth: isoDate.optional(),
};

export const studentOnboardingSchema = z
  .object({
    ...common,
    admissionNumber: z.string().trim().min(1).max(100),
    academicSessionId: z.uuid(),
    classSectionId: z.uuid(),
    guardianName: z.string().trim().min(1).max(200).optional(),
    guardianPhone: z.string().regex(/^\+[1-9]\d{7,14}$/).optional(),
    admissionDate: isoDate,
  })
  .strict();

export const teacherOnboardingSchema = z
  .object({
    ...common,
    employeeNumber: z.string().trim().min(1).max(100),
    designation: z.string().trim().min(1).max(150).optional(),
    department: z.string().trim().min(1).max(150).optional(),
    joiningDate: isoDate,
  })
  .strict();

export const staffOnboardingSchema = z
  .object({
    ...common,
    employeeNumber: z.string().trim().min(1).max(100),
    employeeType: z.enum(EmployeeType).refine((value) => value !== EmployeeType.TEACHER),
    designation: z.string().trim().min(1).max(150).optional(),
    department: z.string().trim().min(1).max(150).optional(),
    joiningDate: isoDate,
  })
  .strict();

export const onboardingListQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(25),
    cursor: z.uuid().optional(),
    personType: z.enum(PersonType).optional(),
    status: z.enum(OnboardingStatus).optional(),
  })
  .strict();

export type StudentOnboardingInput = z.infer<typeof studentOnboardingSchema>;
export type TeacherOnboardingInput = z.infer<typeof teacherOnboardingSchema>;
export type StaffOnboardingInput = z.infer<typeof staffOnboardingSchema>;
export type OnboardingListQuery = z.infer<typeof onboardingListQuerySchema>;
