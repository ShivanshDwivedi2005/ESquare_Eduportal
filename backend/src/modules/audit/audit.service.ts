import { type Prisma } from "@prisma/client";

export interface AuditContext {
  actorUserId: string;
  actorMembershipId?: string | undefined;
  institutionId?: string | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

export interface AuditEvent {
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonObject;
}

export async function writeAuditLog(
  transaction: Prisma.TransactionClient,
  context: AuditContext,
  event: AuditEvent,
): Promise<void> {
  await transaction.auditLog.create({
    data: {
      actorUserId: context.actorUserId,
      actorMembershipId: context.actorMembershipId ?? null,
      institutionId: context.institutionId ?? null,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      metadata: event.metadata ?? {},
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent?.slice(0, 500) ?? null,
    },
  });
}
