"use server";

import { db } from "@/lib/db";
import { consumeVerificationToken } from "@/lib/tokens";

export async function verifyEmailAction(email: string, token: string) {
  const isValid = await consumeVerificationToken(email, token);
  if (!isValid) return { success: false as const };

  await db.user.update({ where: { email }, data: { emailVerified: new Date() } });
  return { success: true as const };
}
