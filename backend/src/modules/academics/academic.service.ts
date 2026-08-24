import { type PrismaClient } from "@prisma/client";

import { ApplicationError } from "../../common/errors.js";
import { withTenantTransaction } from "../../database/authorized-transaction.js";
import type { InstitutionActor } from "../institutions/institution.service.js";
import { writeAuditLog } from "../audit/audit.service.js";
import type {
  academicListQuerySchema,
  createAcademicSessionSchema,
  createClassSectionSchema,
} from "./academic.schemas.js";
import type { z } from "zod";

type SessionInput = z.infer<typeof createAcademicSessionSchema>;
type ClassSectionInput = z.infer<typeof createClassSectionSchema>;
type ListQuery = z.infer<typeof academicListQuerySchema>;

export class AcademicService {
  public constructor(private readonly database: PrismaClient) {}

  public createSession(input: SessionInput, actor: InstitutionActor): Promise<object> {
    return withTenantTransaction(
      actor,
      async (transaction) => {
        const session = await transaction.academicSession.create({
          data: { institutionId: actor.institutionId, ...input },
          select: {
            academicSessionId: true,
            name: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        });
        await writeAuditLog(transaction, this.auditContext(actor), {
          action: "academic.session.created",
          entityType: "academic_session",
          entityId: session.academicSessionId,
        });
        return session;
      },
      this.database,
    );
  }

  public createClassSection(
    input: ClassSectionInput,
    actor: InstitutionActor,
  ): Promise<object> {
    return withTenantTransaction(
      actor,
      async (transaction) => {
        const session = await transaction.academicSession.findFirst({
          where: {
            academicSessionId: input.academicSessionId,
            institutionId: actor.institutionId,
          },
        });
        if (!session) throw new ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found");
        const classSection = await transaction.classSection.create({
          data: {
            institutionId: actor.institutionId,
            academicSessionId: input.academicSessionId,
            classLevel: input.classLevel,
            section: input.section,
            stream: input.stream ?? null,
            status: input.status,
          },
          select: {
            classSectionId: true,
            academicSessionId: true,
            classLevel: true,
            section: true,
            stream: true,
            status: true,
          },
        });
        await writeAuditLog(transaction, this.auditContext(actor), {
          action: "academic.class_section.created",
          entityType: "class_section",
          entityId: classSection.classSectionId,
        });
        return classSection;
      },
      this.database,
    );
  }

  public listSessions(query: ListQuery, actor: InstitutionActor): Promise<object> {
    return withTenantTransaction(
      actor,
      async (transaction) => {
        const rows = await transaction.academicSession.findMany({
          where: {
            institutionId: actor.institutionId,
            ...(query.status ? { status: query.status } : {}),
          },
          take: query.limit + 1,
          ...(query.cursor ? { cursor: { academicSessionId: query.cursor }, skip: 1 } : {}),
          orderBy: [{ startDate: "desc" }, { academicSessionId: "desc" }],
          select: {
            academicSessionId: true,
            name: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        });
        const hasMore = rows.length > query.limit;
        const items = hasMore ? rows.slice(0, query.limit) : rows;
        return {
          items,
          nextCursor: hasMore ? items.at(-1)?.academicSessionId ?? null : null,
        };
      },
      this.database,
    );
  }

  private auditContext(actor: InstitutionActor) {
    return {
      actorUserId: actor.userId,
      actorMembershipId: actor.membershipId,
      institutionId: actor.institutionId,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    };
  }
}
