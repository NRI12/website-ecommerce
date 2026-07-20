import { db } from "@/lib/db";

export async function isProductWishlisted(userId: string | undefined, productId: string) {
  if (!userId) return false;
  const item = await db.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  return Boolean(item);
}

export async function getWishlistForUser(userId: string) {
  const items = await db.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          images: { take: 1, orderBy: { position: "asc" } },
          variants: { select: { price: true, compareAtPrice: true, stock: true } },
          vendor: { select: { storeName: true, slug: true } },
          category: { select: { name: true, slug: true } },
        },
      },
    },
  });

  const LOW_STOCK_THRESHOLD = 5;

  return items.map((item) => {
    const prices = item.product.variants.map((v) => Number(v.price));
    const compareAt = item.product.variants
      .map((v) => (v.compareAtPrice ? Number(v.compareAtPrice) : null))
      .find((v): v is number => v !== null);
    const totalStock = item.product.variants.reduce((sum, v) => sum + v.stock, 0);
    return {
      id: item.id,
      product: {
        id: item.product.id,
        slug: item.product.slug,
        name: item.product.name,
        brand: item.product.brand,
        image: item.product.images[0] ?? null,
        minPrice: prices.length ? Math.min(...prices) : 0,
        compareAtPrice: compareAt ?? null,
        ratingAvg: Number(item.product.ratingAvg),
        ratingCount: item.product.ratingCount,
        inStock: totalStock > 0,
        lowStock: totalStock > 0 && totalStock <= LOW_STOCK_THRESHOLD,
        vendor: item.product.vendor,
        category: item.product.category,
      },
    };
  });
}
