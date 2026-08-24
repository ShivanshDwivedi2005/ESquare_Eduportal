import { z } from "zod";

const normalizedEmail = z.string().trim().toLowerCase().email().max(254);

const strongPassword = z
  .string()
  .min(12)
  .max(128)
  .refine((value) => /[a-z]/.test(value), "Password requires a lowercase letter")
  .refine((value) => /[A-Z]/.test(value), "Password requires an uppercase letter")
  .refine((value) => /\d/.test(value), "Password requires a number");

const personName = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .transform((value) => value.replace(/\s+/g, " "));

export const registerSchema = z
  .object({
    email: normalizedEmail,
    password: strongPassword,
    firstName: personName,
    middleName: personName.optional(),
    lastName: personName,
  })
  .strict();

export const verifyEmailSchema = z
  .object({
    email: normalizedEmail,
    code: z.string().regex(/^\d{6}$/),
  })
  .strict();

export const loginSchema = z
  .object({
    email: normalizedEmail,
    password: z.string().min(1).max(128),
  })
  .strict();

export const forgotPasswordSchema = z.object({ email: normalizedEmail }).strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(40).max(100),
    password: strongPassword,
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
