import { type Prisma, type PrismaClient } from "@prisma/client";

import { database } from "./client.js";

export interface TenantDatabaseContext {
  userId: string;
  institutionId: string;
}

export async function withTenantTransaction<T>(
  context: TenantDatabaseContext,
  operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  client: PrismaClient = database,
): Promise<T> {
  return client.$transaction(
    async (transaction) => {
      await transaction.$queryRaw`
        SELECT
          set_config('app.current_user_id', ${context.userId}, true),
          set_config('app.current_institution_id', ${context.institutionId}, true),
          set_config('app.platform_access', 'false', true)
      `;
      return operation(transaction);
    },
    { isolationLevel: "ReadCommitted", maxWait: 5_000, timeout: 15_000 },
  );
}

export async function withPlatformTransaction<T>(
  userId: string,
  operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  isolationLevel: Prisma.TransactionIsolationLevel = "ReadCommitted",
  client: PrismaClient = database,
): Promise<T> {
  return client.$transaction(
    async (transaction) => {
      await transaction.$queryRaw`
        SELECT
          set_config('app.current_user_id', ${userId}, true),
          set_config('app.current_institution_id', '', true),
          set_config('app.platform_access', 'true', true)
      `;
      return operation(transaction);
    },
    { isolationLevel, maxWait: 5_000, timeout: 20_000 },
  );
}
