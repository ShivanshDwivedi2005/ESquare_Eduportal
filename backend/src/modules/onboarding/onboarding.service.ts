import {
  EmployeeType,
  InvitationType,
  OnboardingStatus,
  PersonType,
  type Prisma,
  type PrismaClient,
} from "@prisma/client";

import { ApplicationError } from "../../common/errors.js";
import { withTenantTransaction } from "../../database/authorized-transaction.js";
import { writeAuditLog } from "../audit/audit.service.js";
import type { InstitutionActor } from "../institutions/institution.service.js";
import { InvitationService } from "../invitations/invitation.service.js";
import type { MailService } from "../notifications/mail.service.js";
import type {
  OnboardingListQuery,
  StaffOnboardingInput,
  StudentOnboardingInput,
  TeacherOnboardingInput,
} from "./onboarding.schemas.js";

const onboardingSelect = {
  onboardingId: true,
  institutionId: true,
  personType: true,
  firstName: true,
  middleName: true,
  lastName: true,
  email: true,
  phone: true,
  dateOfBirth: true,
  status: true,
  claimedByUserId: true,
  createdAt: true,
  updatedAt: true,
  studentDetails: true,
  employeeDetails: true,
  invitation: {
    select: {
      invitationId: true,
      status: true,
      expiresAt: true,
      claimedAt: true,
    },
  },
} satisfies Prisma.OnboardingRecordSelect;

export class OnboardingService {
  private readonly invitationService: InvitationService;

  public constructor(
    private readonly database: PrismaClient,
    private readonly mail: MailService,
  ) {
    this.invitationService = new InvitationService(database, mail);
  }

  public async createStudent(
    input: StudentOnboardingInput,
    actor: InstitutionActor,
  ): Promise<object> {
    const result = await withTenantTransaction(
      actor,
      async (transaction) => {
        const classSection = await transaction.classSection.findFirst({
          where: {
            classSectionId: input.classSectionId,
            institutionId: actor.institutionId,
            academicSessionId: input.academicSessionId,
            status: "ACTIVE",
            academicSession: { institutionId: actor.institutionId, status: "ACTIVE" },
          },
        });
        if (!classSection) {
          throw new ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found");
        }
        const role = await this.role(transaction, "STUDENT");
        const record = await transaction.onboardingRecord.create({
          data: {
            institutionId: actor.institutionId,
            personType: PersonType.STUDENT,
            firstName: input.firstName,
            middleName: input.middleName ?? null,
            lastName: input.lastName,
            email: input.email,
            phone: input.phone ?? null,
            dateOfBirth: input.dateOfBirth ?? null,
            status: OnboardingStatus.INVITED,
            createdByMembershipId: actor.membershipId,
            studentDetails: {
              create: {
                institutionId: actor.institutionId,
                admissionNumber: input.admissionNumber,
                academicSessionId: input.academicSessionId,
                classSectionId: input.classSectionId,
                guardianName: input.guardianName ?? null,
                guardianPhone: input.guardianPhone ?? null,
                admissionDate: input.admissionDate,
              },
            },
          },
          select: onboardingSelect,
        });
        const invitation = await this.invitationService.createForOnboarding(transaction, {
          institutionId: actor.institutionId,
          onboardingRecordId: record.onboardingId,
          email: input.email,
          invitationType: InvitationType.STUDENT,
          targetRoleId: role.roleId,
          createdByMembershipId: actor.membershipId,
        });
        await this.writeCreationAudits(transaction, actor, record.onboardingId, invitation.invitationId, "student");
        const institution = await this.institutionName(transaction, actor.institutionId);
        return { record, invitation, institution };
      },
      this.database,
    );
    await this.mail.sendInvitation(
      input.email,
      result.invitation.rawToken,
      result.institution,
      InvitationType.STUDENT,
    );
    return { ...result.record, invitationId: result.invitation.invitationId };
  }

  public async createTeacher(
    input: TeacherOnboardingInput,
    actor: InstitutionActor,
  ): Promise<object> {
    return this.createEmployee(input, EmployeeType.TEACHER, PersonType.TEACHER, InvitationType.TEACHER, "TEACHER", actor);
  }

  public async createStaff(
    input: StaffOnboardingInput,
    actor: InstitutionActor,
  ): Promise<object> {
    return this.createEmployee(input, input.employeeType, PersonType.STAFF, InvitationType.STAFF, "STAFF", actor);
  }

  public async list(query: OnboardingListQuery, actor: InstitutionActor): Promise<object> {
    return withTenantTransaction(
      actor,
      async (transaction) => {
        const rows = await transaction.onboardingRecord.findMany({
          where: {
            institutionId: actor.institutionId,
            ...(query.personType ? { personType: query.personType } : {}),
            ...(query.status ? { status: query.status } : {}),
          },
          select: onboardingSelect,
          take: query.limit + 1,
          ...(query.cursor ? { cursor: { onboardingId: query.cursor }, skip: 1 } : {}),
          orderBy: [{ createdAt: "desc" }, { onboardingId: "desc" }],
        });
        const hasMore = rows.length > query.limit;
        const items = hasMore ? rows.slice(0, query.limit) : rows;
        return {
          items,
          nextCursor: hasMore ? items.at(-1)?.onboardingId ?? null : null,
        };
      },
      this.database,
    );
  }

  private async createEmployee(
    input: TeacherOnboardingInput | StaffOnboardingInput,
    employeeType: EmployeeType,
    personType: PersonType,
    invitationType: InvitationType,
    roleCode: "TEACHER" | "STAFF",
    actor: InstitutionActor,
  ): Promise<object> {
    const result = await withTenantTransaction(
      actor,
      async (transaction) => {
        const role = await this.role(transaction, roleCode);
        const record = await transaction.onboardingRecord.create({
          data: {
            institutionId: actor.institutionId,
            personType,
            firstName: input.firstName,
            middleName: input.middleName ?? null,
            lastName: input.lastName,
            email: input.email,
            phone: input.phone ?? null,
            dateOfBirth: input.dateOfBirth ?? null,
            status: OnboardingStatus.INVITED,
            createdByMembershipId: actor.membershipId,
            employeeDetails: {
              create: {
                institutionId: actor.institutionId,
                employeeNumber: input.employeeNumber,
                employeeType,
                designation: input.designation ?? null,
                department: input.department ?? null,
                joiningDate: input.joiningDate,
              },
            },
          },
          select: onboardingSelect,
        });
        const invitation = await this.invitationService.createForOnboarding(transaction, {
          institutionId: actor.institutionId,
          onboardingRecordId: record.onboardingId,
          email: input.email,
          invitationType,
          targetRoleId: role.roleId,
          createdByMembershipId: actor.membershipId,
        });
        await this.writeCreationAudits(
          transaction,
          actor,
          record.onboardingId,
          invitation.invitationId,
          personType.toLowerCase(),
        );
        const institution = await this.institutionName(transaction, actor.institutionId);
        return { record, invitation, institution };
      },
      this.database,
    );
    await this.mail.sendInvitation(
      input.email,
      result.invitation.rawToken,
      result.institution,
      invitationType,
    );
    return { ...result.record, invitationId: result.invitation.invitationId };
  }

  private async role(transaction: Prisma.TransactionClient, roleCode: string) {
    const role = await transaction.role.findUnique({ where: { roleCode } });
    if (!role) {
      throw new ApplicationError(500, "AUTHORIZATION_CATALOG_MISSING", "Configuration error", false);
    }
    return role;
  }

  private async institutionName(
    transaction: Prisma.TransactionClient,
    institutionId: string,
  ): Promise<string> {
    const institution = await transaction.institution.findUnique({
      where: { institutionId },
      select: { institutionName: true },
    });
    if (!institution) throw new ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found");
    return institution.institutionName;
  }

  private async writeCreationAudits(
    transaction: Prisma.TransactionClient,
    actor: InstitutionActor,
    onboardingId: string,
    invitationId: string,
    prefix: string,
  ): Promise<void> {
    const context = {
      actorUserId: actor.userId,
      actorMembershipId: actor.membershipId,
      institutionId: actor.institutionId,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    };
    await writeAuditLog(transaction, context, {
      action: `${prefix}.onboarding.created`,
      entityType: "onboarding_record",
      entityId: onboardingId,
    });
    await writeAuditLog(transaction, context, {
      action: `${prefix}.invitation.sent`,
      entityType: "invitation",
      entityId: invitationId,
    });
  }
}
