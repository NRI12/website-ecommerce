"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { sendOrderStatusEmail } from "@/lib/email";
import { ORDER_STATUS_LABELS } from "@/lib/order-labels";

export type ActionResult = { success: boolean; message?: string };

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

const couponSchema = z.object({
  code: z.string().min(3).max(30),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().positive(),
  minOrderAmount: z.coerce.number().min(0).optional(),
  maxDiscount: z.coerce.number().min(0).optional(),
  usageLimit: z.coerce.number().int().min(1).optional(),
  expiresAt: z.string().optional(),
});

export async function createCouponAction(input: z.infer<typeof couponSchema>): Promise<ActionResult> {
  if (!(await requireAdmin())) return { success: false, message: "Không có quyền." };

  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Dữ liệu không hợp lệ." };

  const code = parsed.data.code.trim().toUpperCase();
  const existing = await db.coupon.findUnique({ where: { code } });
  if (existing) return { success: false, message: "Mã giảm giá đã tồn tại." };

  await db.coupon.create({
    data: {
      code,
      type: parsed.data.type,
      value: parsed.data.value,
      minOrderAmount: parsed.data.minOrderAmount,
      maxDiscount: parsed.data.maxDiscount,
      usageLimit: parsed.data.usageLimit,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
    },
  });

  revalidatePath("/admin/coupons");
  return { success: true };
}

export async function toggleCouponActiveAction(couponId: string, active: boolean): Promise<ActionResult> {
  if (!(await requireAdmin())) return { success: false, message: "Không có quyền." };
  await db.coupon.update({ where: { id: couponId }, data: { active } });
  revalidatePath("/admin/coupons");
  return { success: true };
}

export async function updateUserRoleAction(
  userId: string,
  role: "CUSTOMER" | "VENDOR" | "ADMIN",
): Promise<ActionResult> {
  if (!(await requireAdmin())) return { success: false, message: "Không có quyền." };
  await db.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateOrderStatusAction(
  orderId: string,
  status: "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED",
): Promise<ActionResult> {
  if (!(await requireAdmin())) return { success: false, message: "Không có quyền." };
  const order = await db.order.update({
    where: { id: orderId },
    data: { status },
    include: { user: { select: { email: true } } },
  });
  if (order.user.email) {
    await sendOrderStatusEmail(order.user.email, { orderNumber: order.orderNumber }, ORDER_STATUS_LABELS[status] ?? status);
  }
  revalidatePath("/admin/orders");
  return { success: true };
}
