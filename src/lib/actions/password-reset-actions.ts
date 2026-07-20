"use server";

import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/redis";
import { sendPasswordResetEmail } from "@/lib/email";
import { consumePasswordResetToken, createPasswordResetToken } from "@/lib/tokens";

export type ActionResult = { success: boolean; message?: string };

export async function requestPasswordResetAction(email: string): Promise<ActionResult> {
  const parsed = z.string().email().safeParse(email);
  if (!parsed.success) return { success: false, message: "Email không hợp lệ." };

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = await checkRateLimit(`reset-request:${ip}`, 5, 60 * 60);
  if (!allowed) return { success: false, message: "Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau." };

  const user = await db.user.findUnique({ where: { email: parsed.data } });
  // Always respond with success to avoid leaking which emails are registered.
  if (user?.password) {
    const token = await createPasswordResetToken(parsed.data);
    await sendPasswordResetEmail(parsed.data, user.name ?? "", token);
  }

  return { success: true };
}

const resetSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  password: z.string().min(8).max(72),
});

export async function resetPasswordAction(input: z.infer<typeof resetSchema>): Promise<ActionResult> {
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Dữ liệu không hợp lệ." };

  const isValid = await consumePasswordResetToken(parsed.data.email, parsed.data.token);
  if (!isValid) return { success: false, message: "Liên kết không hợp lệ hoặc đã hết hạn." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await db.user.update({
    where: { email: parsed.data.email },
    data: { password: passwordHash },
  });

  return { success: true };
}
