import { db } from "@/lib/db";

export async function getVendorByUserId(userId: string) {
  return db.vendor.findUnique({ where: { userId } });
}

export async function getVendorStats(vendorId: string) {
  const [productCount, orderItemCount, revenueAgg, pendingItemCount] = await Promise.all([
    db.product.count({ where: { vendorId } }),
    db.orderItem.count({ where: { vendorId } }),
    db.orderItem.aggregate({
      where: { vendorId, order: { paymentStatus: "SUCCEEDED" } },
      _sum: { subtotal: true },
    }),
    db.orderItem.count({ where: { vendorId, fulfillmentStatus: "PENDING" } }),
  ]);

  return {
    productCount,
    orderItemCount,
    pendingItemCount,
    revenue: Number(revenueAgg._sum.subtotal ?? 0),
  };
}

export async function getVendorRevenueByDay(vendorId: string, days = 14) {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const items = await db.orderItem.findMany({
    where: { vendorId, order: { paymentStatus: "SUCCEEDED", createdAt: { gte: since } } },
    select: { subtotal: true, order: { select: { createdAt: true } } },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  for (const item of items) {
    const key = item.order.createdAt.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + Number(item.subtotal));
  }

  return Array.from(buckets.entries()).map(([date, revenue]) => ({ date, revenue }));
}

export async function getVendorProducts(vendorId: string) {
  const products = await db.product.findMany({
    where: { vendorId },
    orderBy: { createdAt: "desc" },
    include: {
      images: { take: 1, orderBy: { position: "asc" } },
      variants: { select: { price: true, stock: true } },
      category: { select: { name: true } },
    },
  });

  return products.map((p) => ({
    ...p,
    ratingAvg: Number(p.ratingAvg),
    totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
    minPrice: p.variants.length ? Math.min(...p.variants.map((v) => Number(v.price))) : 0,
  }));
}

export async function getVendorProductById(vendorId: string, productId: string) {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: { images: { orderBy: { position: "asc" } }, variants: true },
  });
  if (!product || product.vendorId !== vendorId) return null;
  return {
    ...product,
    ratingAvg: Number(product.ratingAvg),
    variants: product.variants.map((v) => ({
      ...v,
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
    })),
  };
}

export async function getVendorOrderItems(vendorId: string) {
  const items = await db.orderItem.findMany({
    where: { vendorId },
    orderBy: { id: "desc" },
    include: {
      order: { select: { orderNumber: true, createdAt: true, address: true, paymentStatus: true } },
    },
  });
  return items.map((item) => ({ ...item, unitPrice: Number(item.unitPrice), subtotal: Number(item.subtotal) }));
}
