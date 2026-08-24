export const ROLE_CODES = [
  "ROOT_ADMIN",
  "ADMISSION_ADMIN",
  "FINANCE_ADMIN",
  "PRINCIPAL",
  "TEACHER",
  "STUDENT",
  "STAFF",
] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

export const PERMISSION_CODES = [
  "INSTITUTION_VIEW",
  "INSTITUTION_SETTINGS_MANAGE",
  "ADMIN_VIEW",
  "ADMIN_CREATE",
  "ADMIN_DISABLE",
  "ADMIN_ASSIGN_ROLE",
  "STUDENT_CREATE",
  "STUDENT_VIEW",
  "STUDENT_UPDATE",
  "TEACHER_CREATE",
  "TEACHER_VIEW",
  "TEACHER_UPDATE",
  "STAFF_CREATE",
  "STAFF_VIEW",
  "STAFF_UPDATE",
  "ADMISSION_INVITE_SEND",
  "ADMISSION_INVITE_RESEND",
  "ADMISSION_INVITE_REVOKE",
  "ACADEMIC_SESSION_MANAGE",
  "CLASS_SECTION_MANAGE",
  "FINANCE_VIEW",
  "FINANCE_MANAGE",
  "AUDIT_VIEW",
] as const;

export type PermissionCode = (typeof PERMISSION_CODES)[number];

export const ASSIGNABLE_ADMIN_ROLES: Readonly<Record<RoleCode, readonly RoleCode[]>> = {
  ROOT_ADMIN: ["ADMISSION_ADMIN", "FINANCE_ADMIN", "PRINCIPAL"],
  ADMISSION_ADMIN: [],
  FINANCE_ADMIN: [],
  PRINCIPAL: [],
  TEACHER: [],
  STUDENT: [],
  STAFF: [],
};

export function mayAssignRole(assignerRoles: readonly RoleCode[], target: RoleCode): boolean {
  return assignerRoles.some((role) => ASSIGNABLE_ADMIN_ROLES[role].includes(target));
}
