"use server";

import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/redis";
import { sendVerificationEmail } from "@/lib/email";
import { createVerificationToken } from "@/lib/tokens";

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export type RegisterResult = { success: boolean; message?: string };

export async function registerAction(input: z.infer<typeof registerSchema>): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Thông tin đăng ký không hợp lệ." };
  }

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = await checkRateLimit(`register:${ip}`, 5, 60 * 60);
  if (!allowed) {
    return { success: false, message: "Bạn đã thử đăng ký quá nhiều lần. Vui lòng thử lại sau." };
  }

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { success: false, message: "Email này đã được đăng ký." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: passwordHash,
    },
  });

  const token = await createVerificationToken(user.email!);
  await sendVerificationEmail(user.email!, user.name ?? "", token);

  return { success: true };
}
