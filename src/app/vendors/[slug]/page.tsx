import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductCard } from "@/components/product/product-card";
import { db } from "@/lib/db";
import { getProducts } from "@/lib/data/products";

interface VendorStorefrontPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: VendorStorefrontPageProps): Promise<Metadata> {
  const { slug } = await params;
  const vendor = await db.vendor.findUnique({ where: { slug }, select: { storeName: true } });
  return { title: vendor?.storeName ?? "Gian hàng" };
}

export default async function VendorStorefrontPage({ params }: VendorStorefrontPageProps) {
  const { slug } = await params;
  const vendor = await db.vendor.findUnique({ where: { slug } });
  if (!vendor || vendor.status !== "APPROVED") notFound();

  const { products, total } = await getProducts({ vendorSlug: slug, pageSize: 40 });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{vendor.storeName}</h1>
        {vendor.description ? <p className="mt-1 text-muted-foreground">{vendor.description}</p> : null}
        <p className="mt-1 text-sm text-muted-foreground">{total} sản phẩm</p>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Gian hàng chưa có sản phẩm nào.</p>
      )}
    </div>
  );
}
