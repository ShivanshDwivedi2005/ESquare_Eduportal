import argon2 from "argon2";
import bcrypt from "bcryptjs";

const options = {
  type: argon2.argon2id,
  memoryCost: 65_536,
  timeCost: 3,
  parallelism: 1,
} as const;

const dummyPasswordHash = argon2.hash("invalid-password-probe", options);

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, options);
}

export async function verifyPassword(
  passwordHash: string | null | undefined,
  password: string,
): Promise<boolean> {
  try {
    if (passwordHash?.startsWith("$2")) {
      return await bcrypt.compare(password, passwordHash);
    }
    return await argon2.verify(passwordHash ?? (await dummyPasswordHash), password);
  } catch {
    return false;
  }
}

export function passwordHashNeedsUpgrade(passwordHash: string): boolean {
  return !passwordHash.startsWith("$argon2id$");
}
