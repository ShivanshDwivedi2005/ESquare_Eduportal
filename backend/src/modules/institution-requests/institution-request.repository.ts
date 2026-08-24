import { type Prisma, type PrismaClient } from "@prisma/client";

export interface LockedRegistrationRequest {
  request_id: string;
}

export class InstitutionRequestRepository {
  public constructor(private readonly database: PrismaClient) {}

  public transaction<T>(
    operation: (transaction: Prisma.TransactionClient) => Promise<T>,
    isolationLevel: Prisma.TransactionIsolationLevel = "ReadCommitted",
  ): Promise<T> {
    return this.database.$transaction(operation, {
      isolationLevel,
      maxWait: 5_000,
      timeout: 20_000,
    });
  }

  public async lockRequest(
    transaction: Prisma.TransactionClient,
    requestId: string,
  ): Promise<boolean> {
    const rows = await transaction.$queryRaw<LockedRegistrationRequest[]>`
      SELECT request_id
      FROM institution_registration_requests
      WHERE request_id = ${requestId}::uuid
      LIMIT 1
      FOR UPDATE
    `;
    return rows.length === 1;
  }
}
