import { db } from "@/lib/db";

export async function getOrdersForUser(userId: string) {
  const orders = await db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { product: { select: { slug: true, images: { take: 1, orderBy: { position: "asc" } } } } },
      },
    },
  });

  return orders.map((order) => ({
    ...order,
    subtotal: Number(order.subtotal),
    shippingFee: Number(order.shippingFee),
    discountTotal: Number(order.discountTotal),
    taxTotal: Number(order.taxTotal),
    total: Number(order.total),
    items: order.items.map((item) => ({ ...item, unitPrice: Number(item.unitPrice), subtotal: Number(item.subtotal) })),
  }));
}

export async function getOrderByNumberForUser(orderNumber: string, userId: string) {
  const order = await db.order.findUnique({
    where: { orderNumber },
    include: {
      address: true,
      items: {
        include: {
          product: { select: { slug: true, images: { take: 1, orderBy: { position: "asc" } } } },
          vendor: { select: { storeName: true } },
        },
      },
      payment: true,
    },
  });

  if (!order || order.userId !== userId) return null;

  return {
    ...order,
    subtotal: Number(order.subtotal),
    shippingFee: Number(order.shippingFee),
    discountTotal: Number(order.discountTotal),
    taxTotal: Number(order.taxTotal),
    total: Number(order.total),
    items: order.items.map((item) => ({ ...item, unitPrice: Number(item.unitPrice), subtotal: Number(item.subtotal) })),
  };
}
