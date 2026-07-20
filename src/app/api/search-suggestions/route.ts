import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ProductStatus, VendorStatus } from "@/generated/prisma/enums";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ suggestions: [] });

  const products = await db.product.findMany({
    where: {
      status: ProductStatus.ACTIVE,
      vendor: { status: VendorStatus.APPROVED },
      name: { contains: q, mode: "insensitive" },
    },
    orderBy: { ratingCount: "desc" },
    take: 6,
    select: {
      slug: true,
      name: true,
      images: { take: 1, orderBy: { position: "asc" }, select: { url: true } },
      variants: { select: { price: true } },
    },
  });

  const suggestions = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    imageUrl: p.images[0]?.url ?? null,
    minPrice: p.variants.length ? Math.min(...p.variants.map((v) => Number(v.price))) : 0,
  }));

  return NextResponse.json({ suggestions });
}
