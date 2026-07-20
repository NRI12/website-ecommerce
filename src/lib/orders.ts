import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function markOrderPaid(params: {
  orderNumber: string;
  provider: "STRIPE";
  providerRef: string;
  amount: number;
  currency: string;
  rawPayload?: Prisma.InputJsonValue;
}) {
  const order = await db.order.findUnique({
    where: { orderNumber: params.orderNumber },
    include: { user: { select: { email: true } } },
  });
  if (!order) return { ok: false as const, reason: "ORDER_NOT_FOUND" as const };

  if (order.paymentStatus === "SUCCEEDED") {
    return { ok: true as const, order, alreadyProcessed: true };
  }

  await db.$transaction([
    db.payment.upsert({
      where: { orderId: order.id },
      update: {
        status: "SUCCEEDED",
        providerRef: params.providerRef,
        rawPayload: params.rawPayload,
      },
      create: {
        orderId: order.id,
        provider: params.provider,
        providerRef: params.providerRef,
        amount: params.amount,
        currency: params.currency,
        status: "SUCCEEDED",
        rawPayload: params.rawPayload,
      },
    }),
    db.order.update({
      where: { id: order.id },
      data: { paymentStatus: "SUCCEEDED", status: "PAID" },
    }),
  ]);

  if (order.user.email) {
    await sendOrderConfirmationEmail(order.user.email, {
      orderNumber: order.orderNumber,
      total: Number(order.total),
      currency: order.currency,
    });
  }

  return { ok: true as const, order, alreadyProcessed: false };
}

export async function markOrderFailed(orderNumber: string) {
  const order = await db.order.findUnique({ where: { orderNumber } });
  if (!order || order.paymentStatus === "SUCCEEDED") return;

  await db.order.update({
    where: { id: order.id },
    data: { paymentStatus: "FAILED" },
  });
}
