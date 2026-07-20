"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export type ActionResult = { success: boolean; message?: string };

const registerVendorSchema = z.object({
  storeName: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
});

const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function registerVendorAction(
  input: z.infer<typeof registerVendorSchema>,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Vui lòng đăng nhập." };

  const parsed = registerVendorSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Thông tin không hợp lệ." };

  const existing = await db.vendor.findUnique({ where: { userId: session.user.id } });
  if (existing) return { success: false, message: "Bạn đã đăng ký gian hàng rồi." };

  const baseSlug = slugify(parsed.data.storeName) || "shop";
  let slug = baseSlug;
  let suffix = 1;
  while (await db.vendor.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  await db.$transaction([
    db.vendor.create({
      data: {
        userId: session.user.id,
        storeName: parsed.data.storeName,
        slug,
        description: parsed.data.description,
        status: "PENDING",
      },
    }),
    db.user.update({ where: { id: session.user.id }, data: { role: "VENDOR" } }),
  ]);

  revalidatePath("/vendor");
  return { success: true };
}

export async function approveVendorAction(vendorId: string): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { success: false, message: "Không có quyền." };

  await db.vendor.update({ where: { id: vendorId }, data: { status: "APPROVED" } });
  revalidatePath("/admin/vendors");
  return { success: true };
}

export async function suspendVendorAction(vendorId: string): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { success: false, message: "Không có quyền." };

  await db.vendor.update({ where: { id: vendorId }, data: { status: "SUSPENDED" } });
  revalidatePath("/admin/vendors");
  return { success: true };
}
