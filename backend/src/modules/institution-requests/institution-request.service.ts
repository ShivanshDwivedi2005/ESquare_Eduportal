import {
  RegistrationRequestStatus,
  type Prisma,
  type PrismaClient,
} from "@prisma/client";

import { ApplicationError } from "../../common/errors.js";
import { withPlatformTransaction } from "../../database/authorized-transaction.js";
import { writeAuditLog } from "../audit/audit.service.js";
import { InstitutionRequestRepository } from "./institution-request.repository.js";
import type {
  CreateInstitutionRequestInput,
  RequestListQuery,
} from "./institution-request.schemas.js";

export interface RequestActor {
  userId: string;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

const requestSelect = {
  requestId: true,
  institutionName: true,
  institutionType: true,
  boardId: true,
  registrationNumber: true,
  officialEmail: true,
  officialPhone: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
  proofFileId: true,
  status: true,
  reviewedAt: true,
  rejectionReason: true,
  approvedInstitutionId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.InstitutionRegistrationRequestSelect;

export class InstitutionRequestService {
  private readonly repository: InstitutionRequestRepository;

  public constructor(private readonly database: PrismaClient) {
    this.repository = new InstitutionRequestRepository(database);
  }

  public async create(
    input: CreateInstitutionRequestInput,
    actor: RequestActor,
  ): Promise<object> {
    if (input.boardId) {
      const board = await this.database.board.findUnique({ where: { boardId: input.boardId } });
      if (!board) throw new ApplicationError(422, "INVALID_BOARD", "Request validation failed");
    }

    return this.repository.transaction(async (transaction) => {
      const request = await transaction.institutionRegistrationRequest.create({
        data: {
          submittedByUserId: actor.userId,
          institutionName: input.institutionName,
          institutionType: input.institutionType,
          boardId: input.boardId ?? null,
          registrationNumber: input.registrationNumber ?? null,
          officialEmail: input.officialEmail,
          officialPhone: input.officialPhone,
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2 ?? null,
          city: input.city,
          state: input.state,
          postalCode: input.postalCode,
          country: input.country,
          proofFileId: input.proofFileId ?? null,
        },
        select: requestSelect,
      });
      await writeAuditLog(
        transaction,
        {
          actorUserId: actor.userId,
          ipAddress: actor.ipAddress,
          userAgent: actor.userAgent,
        },
        {
          action: "institution.request.created",
          entityType: "institution_registration_request",
          entityId: request.requestId,
        },
      );
      return request;
    });
  }

  public async listMine(userId: string, query: RequestListQuery): Promise<object> {
    const items = await this.database.institutionRegistrationRequest.findMany({
      where: {
        submittedByUserId: userId,
        ...(query.status ? { status: query.status } : {}),
      },
      select: requestSelect,
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { requestId: query.cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: query.direction }, { requestId: query.direction }],
    });
    return this.page(items, query.limit);
  }

  public async getMine(userId: string, requestId: string): Promise<object> {
    const request = await this.database.institutionRegistrationRequest.findFirst({
      where: { requestId, submittedByUserId: userId },
      select: requestSelect,
    });
    if (!request) throw new ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found");
    return request;
  }

  public async listForPlatform(query: RequestListQuery): Promise<object> {
    const items = await this.database.institutionRegistrationRequest.findMany({
      where: query.status ? { status: query.status } : {},
      select: {
        ...requestSelect,
        submittedByUserId: true,
        submittedByUser: {
          select: {
            email: true,
            profile: { select: { firstName: true, middleName: true, lastName: true } },
          },
        },
        reviewedByUserId: true,
      },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { requestId: query.cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: query.direction }, { requestId: query.direction }],
    });
    return this.page(items, query.limit);
  }

  public async getForPlatform(requestId: string): Promise<object> {
    const request = await this.database.institutionRegistrationRequest.findUnique({
      where: { requestId },
      select: {
        ...requestSelect,
        submittedByUserId: true,
        submittedByUser: {
          select: {
            email: true,
            phone: true,
            profile: true,
          },
        },
        reviewedByUserId: true,
      },
    });
    if (!request) throw new ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found");
    return request;
  }

  public async startReview(requestId: string, actor: RequestActor): Promise<object> {
    return withPlatformTransaction(actor.userId, async (transaction) => {
      if (!(await this.repository.lockRequest(transaction, requestId))) {
        throw new ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found");
      }
      const request = await transaction.institutionRegistrationRequest.findUnique({
        where: { requestId },
      });
      if (!request || request.status !== RegistrationRequestStatus.PENDING) {
        throw new ApplicationError(409, "REQUEST_STATE_CONFLICT", "Request cannot enter review");
      }
      const updated = await transaction.institutionRegistrationRequest.update({
        where: { requestId },
        data: {
          status: RegistrationRequestStatus.UNDER_REVIEW,
          reviewedByUserId: actor.userId,
          rejectionReason: null,
        },
        select: requestSelect,
      });
      await writeAuditLog(
        transaction,
        {
          actorUserId: actor.userId,
          ipAddress: actor.ipAddress,
          userAgent: actor.userAgent,
        },
        {
          action: "institution.request.review_started",
          entityType: "institution_registration_request",
          entityId: requestId,
        },
      );
      return updated;
    }, "ReadCommitted", this.database);
  }

  public async approve(requestId: string, actor: RequestActor): Promise<object> {
    return withPlatformTransaction(
      actor.userId,
      async (transaction) => {
        if (!(await this.repository.lockRequest(transaction, requestId))) {
          throw new ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found");
        }
        const request = await transaction.institutionRegistrationRequest.findUnique({
          where: { requestId },
        });
        if (
          !request ||
          request.status !== RegistrationRequestStatus.UNDER_REVIEW ||
          request.approvedInstitutionId
        ) {
          throw new ApplicationError(409, "REQUEST_STATE_CONFLICT", "Request cannot be approved");
        }
        const rootRole = await transaction.role.findUnique({ where: { roleCode: "ROOT_ADMIN" } });
        if (!rootRole) {
          throw new ApplicationError(
            500,
            "AUTHORIZATION_CATALOG_MISSING",
            "Authorization catalog is not seeded",
            false,
          );
        }

        const institution = await transaction.institution.create({
          data: {
            institutionCode: this.institutionCode(request.institutionType, request.requestId),
            institutionName: request.institutionName,
            institutionType: request.institutionType,
            boardId: request.boardId,
          },
        });
        const membership = await transaction.institutionMembership.create({
          data: {
            institutionId: institution.institutionId,
            userId: request.submittedByUserId,
            status: "ACTIVE",
          },
        });
        await transaction.membershipRole.create({
          data: {
            membershipId: membership.membershipId,
            roleId: rootRole.roleId,
            assignedByMembershipId: null,
          },
        });
        const reviewedAt = new Date();
        await transaction.institutionRegistrationRequest.update({
          where: { requestId },
          data: {
            status: RegistrationRequestStatus.APPROVED,
            reviewedByUserId: actor.userId,
            reviewedAt,
            rejectionReason: null,
            approvedInstitutionId: institution.institutionId,
          },
        });
        await writeAuditLog(
          transaction,
          {
            actorUserId: actor.userId,
            institutionId: institution.institutionId,
            ipAddress: actor.ipAddress,
            userAgent: actor.userAgent,
          },
          {
            action: "institution.request.approved",
            entityType: "institution_registration_request",
            entityId: requestId,
            metadata: {
              institutionId: institution.institutionId,
              membershipId: membership.membershipId,
            },
          },
        );
        return {
          requestId,
          status: RegistrationRequestStatus.APPROVED,
          reviewedAt,
          institution: {
            institutionId: institution.institutionId,
            institutionCode: institution.institutionCode,
            institutionName: institution.institutionName,
          },
          rootMembershipId: membership.membershipId,
        };
      },
      "Serializable",
      this.database,
    );
  }

  public async reject(
    requestId: string,
    rejectionReason: string,
    actor: RequestActor,
  ): Promise<object> {
    return withPlatformTransaction(actor.userId, async (transaction) => {
      if (!(await this.repository.lockRequest(transaction, requestId))) {
        throw new ApplicationError(404, "RESOURCE_NOT_FOUND", "Resource not found");
      }
      const request = await transaction.institutionRegistrationRequest.findUnique({
        where: { requestId },
      });
      if (!request || request.status !== RegistrationRequestStatus.UNDER_REVIEW) {
        throw new ApplicationError(409, "REQUEST_STATE_CONFLICT", "Request cannot be rejected");
      }
      const reviewedAt = new Date();
      const updated = await transaction.institutionRegistrationRequest.update({
        where: { requestId },
        data: {
          status: RegistrationRequestStatus.REJECTED,
          reviewedByUserId: actor.userId,
          reviewedAt,
          rejectionReason,
        },
        select: requestSelect,
      });
      await writeAuditLog(
        transaction,
        {
          actorUserId: actor.userId,
          ipAddress: actor.ipAddress,
          userAgent: actor.userAgent,
        },
        {
          action: "institution.request.rejected",
          entityType: "institution_registration_request",
          entityId: requestId,
          metadata: { rejectionReason },
        },
      );
      return updated;
    }, "ReadCommitted", this.database);
  }

  private page<T extends { requestId: string }>(items: T[], limit: number) {
    const hasMore = items.length > limit;
    const pageItems = hasMore ? items.slice(0, limit) : items;
    return {
      items: pageItems,
      nextCursor: hasMore ? pageItems.at(-1)?.requestId ?? null : null,
    };
  }

  private institutionCode(type: string, requestId: string): string {
    return `ESQ-${type.slice(0, 3)}-${requestId.replaceAll("-", "").slice(0, 10)}`.toUpperCase();
  }
}
