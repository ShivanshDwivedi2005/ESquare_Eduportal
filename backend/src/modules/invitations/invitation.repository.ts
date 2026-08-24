import { type Prisma } from "@prisma/client";

export class InvitationRepository {
  public async lockByTokenHash(
    transaction: Prisma.TransactionClient,
    tokenHash: string,
  ): Promise<string | null> {
    const rows = await transaction.$queryRaw<{ invitation_id: string }[]>`
      SELECT invitation_id
      FROM invitations
      WHERE token_hash = ${tokenHash}
      LIMIT 1
      FOR UPDATE
    `;
    return rows[0]?.invitation_id ?? null;
  }

  public async lockById(
    transaction: Prisma.TransactionClient,
    invitationId: string,
    institutionId: string,
  ): Promise<boolean> {
    const rows = await transaction.$queryRaw<{ invitation_id: string }[]>`
      SELECT invitation_id
      FROM invitations
      WHERE invitation_id = ${invitationId}::uuid
        AND institution_id = ${institutionId}::uuid
      LIMIT 1
      FOR UPDATE
    `;
    return rows.length === 1;
  }
}
