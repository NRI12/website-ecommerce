import "server-only";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";

const VERIFY_PREFIX = "verify-email:";
const RESET_PREFIX = "password-reset:";

async function createToken(identifier: string, ttlSeconds: number) {
  const token = nanoid(32);
  await db.verificationToken.deleteMany({ where: { identifier } });
  await db.verificationToken.create({
    data: { identifier, token, expires: new Date(Date.now() + ttlSeconds * 1000) },
  });
  return token;
}

async function consumeToken(identifier: string, token: string) {
  const record = await db.verificationToken.findUnique({
    where: { identifier_token: { identifier, token } },
  });
  if (!record || record.expires < new Date()) return false;
  await db.verificationToken.delete({ where: { identifier_token: { identifier, token } } });
  return true;
}

export function createVerificationToken(email: string) {
  return createToken(`${VERIFY_PREFIX}${email}`, 60 * 60 * 24);
}

export function consumeVerificationToken(email: string, token: string) {
  return consumeToken(`${VERIFY_PREFIX}${email}`, token);
}

export function createPasswordResetToken(email: string) {
  return createToken(`${RESET_PREFIX}${email}`, 60 * 60);
}

export function consumePasswordResetToken(email: string, token: string) {
  return consumeToken(`${RESET_PREFIX}${email}`, token);
}
