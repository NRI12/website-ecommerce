import { db } from "@/lib/db";

export async function getPlatformStats() {
  const [userCount, vendorCount, orderCount, revenueAgg] = await Promise.all([
    db.user.count(),
    db.vendor.count({ where: { status: "APPROVED" } }),
    db.order.count(),
    db.order.aggregate({ where: { paymentStatus: "SUCCEEDED" }, _sum: { total: true } }),
  ]);

  return {
    userCount,
    vendorCount,
    orderCount,
    revenue: Number(revenueAgg._sum.total ?? 0),
  };
}

export async function getRevenueByDay(days = 14) {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const orders = await db.order.findMany({
    where: { paymentStatus: "SUCCEEDED", createdAt: { gte: since } },
    select: { total: true, createdAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + Number(order.total));
  }

  return Array.from(buckets.entries()).map(([date, revenue]) => ({ date, revenue }));
}

export async function getAllVendors() {
  const vendors = await db.vendor.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } }, _count: { select: { products: true } } },
  });
  return vendors;
}

export async function getAllOrders(limit = 50) {
  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { name: true, email: true } } },
  });
  return orders.map((o) => ({ ...o, total: Number(o.total) }));
}

export async function getAllCoupons() {
  const coupons = await db.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { vendor: { select: { storeName: true } } },
  });
  return coupons.map((c) => ({
    ...c,
    value: Number(c.value),
    minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null,
    maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
  }));
}

export async function getAllUsers() {
  return db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
}
