import {
  ChallengePurpose,
  type Prisma,
  type PrismaClient,
} from "@prisma/client";

type QueryClient = PrismaClient | Prisma.TransactionClient;

export interface LockedChallenge {
  challenge_id: string;
  user_id: string | null;
  token_hash: string;
  attempts: number;
  expires_at: Date;
  consumed_at: Date | null;
}

export interface LockedRefreshSession {
  session_id: string;
  user_id: string;
  expires_at: Date;
  revoked_at: Date | null;
}

export class AuthRepository {
  public constructor(private readonly database: PrismaClient) {}

  public transaction<T>(
    operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.database.$transaction(operation, {
      isolationLevel: "ReadCommitted",
      maxWait: 5_000,
      timeout: 15_000,
    });
  }

  public findUserByEmail(client: QueryClient, email: string) {
    return client.user.findUnique({ where: { email }, include: { profile: true } });
  }

  public getUserView(client: QueryClient, userId: string) {
    return client.user.findUnique({
      where: { userId },
      include: {
        profile: true,
        memberships: {
          where: { status: "ACTIVE" },
          include: {
            institution: {
              select: {
                institutionId: true,
                institutionCode: true,
                institutionName: true,
                status: true,
              },
            },
            roles: {
              include: { role: { select: { roleCode: true } } },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    });
  }

  public async lockLatestEmailChallenge(
    transaction: Prisma.TransactionClient,
    email: string,
  ): Promise<LockedChallenge | null> {
    const rows = await transaction.$queryRaw<LockedChallenge[]>`
      SELECT challenge_id, user_id, token_hash, attempts, expires_at, consumed_at
      FROM verification_challenges
      WHERE email = ${email}::citext
        AND purpose = 'EMAIL_VERIFICATION'::"ChallengePurpose"
        AND consumed_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
      FOR UPDATE
    `;
    return rows[0] ?? null;
  }

  public async lockChallengeByHash(
    transaction: Prisma.TransactionClient,
    tokenHash: string,
    purpose: ChallengePurpose,
  ): Promise<LockedChallenge | null> {
    const rows = await transaction.$queryRaw<LockedChallenge[]>`
      SELECT challenge_id, user_id, token_hash, attempts, expires_at, consumed_at
      FROM verification_challenges
      WHERE token_hash = ${tokenHash}
        AND purpose = ${purpose}::"ChallengePurpose"
      LIMIT 1
      FOR UPDATE
    `;
    return rows[0] ?? null;
  }

  public async lockRefreshSession(
    transaction: Prisma.TransactionClient,
    tokenHash: string,
  ): Promise<LockedRefreshSession | null> {
    const rows = await transaction.$queryRaw<LockedRefreshSession[]>`
      SELECT session_id, user_id, expires_at, revoked_at
      FROM refresh_sessions
      WHERE token_hash = ${tokenHash}
      LIMIT 1
      FOR UPDATE
    `;
    return rows[0] ?? null;
  }
}
