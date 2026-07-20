import { db } from "@/lib/db";
import { ProductStatus, VendorStatus } from "@/generated/prisma/enums";

const productCardSelect = {
  id: true,
  slug: true,
  name: true,
  ratingAvg: true,
  ratingCount: true,
  images: {
    orderBy: { position: "asc" as const },
    take: 1,
    select: { url: true, alt: true },
  },
  variants: {
    select: { price: true, compareAtPrice: true },
  },
  vendor: {
    select: { storeName: true, slug: true },
  },
  category: {
    select: { name: true, slug: true },
  },
} as const;

export type ProductCard = Awaited<ReturnType<typeof mapProductCard>>;

function mapProductCard(product: {
  id: string;
  slug: string;
  name: string;
  ratingAvg: unknown;
  ratingCount: number;
  images: { url: string; alt: string | null }[];
  variants: { price: unknown; compareAtPrice: unknown | null }[];
  vendor: { storeName: string; slug: string };
  category: { name: string; slug: string };
}) {
  const prices = product.variants.map((v) => Number(v.price));
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const compareAt = product.variants
    .map((v) => (v.compareAtPrice ? Number(v.compareAtPrice) : null))
    .find((v): v is number => v !== null);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    image: product.images[0] ?? null,
    minPrice,
    compareAtPrice: compareAt ?? null,
    ratingAvg: Number(product.ratingAvg),
    ratingCount: product.ratingCount,
    vendor: product.vendor,
    category: product.category,
  };
}

export async function getFeaturedProducts(limit = 8) {
  const products = await db.product.findMany({
    where: { status: ProductStatus.ACTIVE, vendor: { status: VendorStatus.APPROVED } },
    orderBy: [{ ratingAvg: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: productCardSelect,
  });
  return products.map(mapProductCard);
}

export async function getNewArrivals(limit = 8) {
  const products = await db.product.findMany({
    where: { status: ProductStatus.ACTIVE, vendor: { status: VendorStatus.APPROVED } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: productCardSelect,
  });
  return products.map(mapProductCard);
}

export async function getCategories() {
  return db.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, imageUrl: true },
  });
}

export async function getCategoryBySlug(slug: string) {
  return db.category.findUnique({ where: { slug } });
}

export type ProductSort = "newest" | "rating" | "price-asc" | "price-desc";

interface ProductListFilters {
  categorySlug?: string;
  vendorSlug?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}

const SORT_ORDER_BY: Record<ProductSort, object> = {
  newest: { createdAt: "desc" },
  rating: { ratingAvg: "desc" },
  "price-asc": { variants: { _min: { price: "asc" } } },
  "price-desc": { variants: { _min: { price: "desc" } } },
};

export async function getProducts(filters: ProductListFilters = {}) {
  const {
    categorySlug,
    vendorSlug,
    search,
    minPrice,
    maxPrice,
    sort = "newest",
    page = 1,
    pageSize = 20,
  } = filters;

  const priceFilter =
    minPrice !== undefined || maxPrice !== undefined
      ? {
          variants: {
            some: {
              price: {
                ...(minPrice !== undefined ? { gte: minPrice } : {}),
                ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
              },
            },
          },
        }
      : {};

  const where = {
    status: ProductStatus.ACTIVE,
    vendor: { status: VendorStatus.APPROVED, ...(vendorSlug ? { slug: vendorSlug } : {}) },
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {}),
    ...priceFilter,
  };

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: SORT_ORDER_BY[sort],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: productCardSelect,
    }),
    db.product.count({ where }),
  ]);

  return {
    products: products.map(mapProductCard),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getProductBySlug(slug: string) {
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: { price: "asc" } },
      vendor: { select: { id: true, storeName: true, slug: true, logoUrl: true, status: true } },
      category: { select: { id: true, name: true, slug: true } },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { name: true, image: true } } },
      },
    },
  });

  if (!product || product.status !== ProductStatus.ACTIVE) return null;
  if (product.vendor.status !== VendorStatus.APPROVED) return null;

  return {
    ...product,
    ratingAvg: Number(product.ratingAvg),
    variants: product.variants.map((v) => ({
      ...v,
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
    })),
    reviews: product.reviews.map((r) => ({ ...r })),
  };
}

export async function getRelatedProducts(productId: string, categoryId: string, limit = 4) {
  const products = await db.product.findMany({
    where: {
      id: { not: productId },
      categoryId,
      status: ProductStatus.ACTIVE,
      vendor: { status: VendorStatus.APPROVED },
    },
    take: limit,
    orderBy: { ratingAvg: "desc" },
    select: productCardSelect,
  });
  return products.map(mapProductCard);
}

export async function getFrequentlyBoughtTogether(productId: string, limit = 4) {
  const coOrders = await db.orderItem.findMany({
    where: { productId },
    select: { orderId: true },
    distinct: ["orderId"],
  });
  const orderIds = coOrders.map((o) => o.orderId);
  if (orderIds.length === 0) return [];

  const coItems = await db.orderItem.groupBy({
    by: ["productId"],
    where: { orderId: { in: orderIds }, productId: { not: productId } },
    _count: { productId: true },
    orderBy: { _count: { productId: "desc" } },
    take: limit,
  });
  if (coItems.length === 0) return [];

  const products = await db.product.findMany({
    where: {
      id: { in: coItems.map((c) => c.productId) },
      status: ProductStatus.ACTIVE,
      vendor: { status: VendorStatus.APPROVED },
    },
    select: productCardSelect,
  });

  const order = new Map(coItems.map((c, i) => [c.productId, i]));
  return products.map(mapProductCard).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}
