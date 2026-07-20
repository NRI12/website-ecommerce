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
          variants: { select: { price: true, compareAtPrice: true } },
          vendor: { select: { storeName: true, slug: true } },
          category: { select: { name: true, slug: true } },
        },
      },
    },
  });

  return items.map((item) => {
    const prices = item.product.variants.map((v) => Number(v.price));
    return {
      id: item.id,
      product: {
        id: item.product.id,
        slug: item.product.slug,
        name: item.product.name,
        image: item.product.images[0] ?? null,
        minPrice: prices.length ? Math.min(...prices) : 0,
        compareAtPrice: null,
        ratingAvg: Number(item.product.ratingAvg),
        ratingCount: item.product.ratingCount,
        vendor: item.product.vendor,
        category: item.product.category,
      },
    };
  });
}
