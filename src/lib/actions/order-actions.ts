"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export type OrderActionResult = { success: true } | { success: false; message: string };

// Customers can only self-cancel while the order hasn't started fulfillment
// or been paid for yet — once it's PAID/PROCESSING+ a vendor or admin has to
// handle it, since stock/commission bookkeeping is already in motion.
const CANCELLABLE_STATUSES = new Set(["PENDING"]);

export async function cancelOrderAction(orderId: string): Promise<OrderActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Vui lòng đăng nhập." };

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== session.user.id) {
    return { success: false, message: "Không tìm thấy đơn hàng." };
  }
  if (!CANCELLABLE_STATUSES.has(order.status)) {
    return { success: false, message: "Đơn hàng này không thể hủy ở trạng thái hiện tại." };
  }

  await db.$transaction(async (tx) => {
    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      });
    }
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED", paymentStatus: order.paymentStatus === "SUCCEEDED" ? "REFUNDED" : "FAILED" },
    });
  });

  revalidatePath(`/account/orders/${order.orderNumber}`);
  revalidatePath("/account/orders");
  return { success: true };
}
