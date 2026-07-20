import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

// This route reads from the database, so it must be evaluated per-request
// rather than prerendered at build time (when no database is reachable).
export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, vendors] = await Promise.all([
    db.product.findMany({
      where: { status: "ACTIVE", vendor: { status: "APPROVED" } },
      select: { slug: true, updatedAt: true },
      take: 5000,
    }),
    db.category.findMany({ select: { slug: true } }),
    db.vendor.findMany({ where: { status: "APPROVED" }, select: { slug: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL, changeFrequency: "daily", priority: 1 },
    { url: `${APP_URL}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${APP_URL}/about`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${APP_URL}/contact`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${APP_URL}/policies/shipping`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${APP_URL}/policies/returns`, changeFrequency: "monthly", priority: 0.2 },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${APP_URL}/products/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${APP_URL}/categories/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const vendorRoutes: MetadataRoute.Sitemap = vendors.map((v) => ({
    url: `${APP_URL}/vendors/${v.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...vendorRoutes];
}
