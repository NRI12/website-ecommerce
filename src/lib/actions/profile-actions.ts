"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export type ActionResult = { success: boolean; message?: string };

const profileSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().max(20).optional(),
});

export async function updateProfileAction(input: z.infer<typeof profileSchema>): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Vui lòng đăng nhập." };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Thông tin không hợp lệ." };

  await db.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name, phone: parsed.data.phone },
  });

  revalidatePath("/account/profile");
  return { success: true };
}
