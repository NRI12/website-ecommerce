import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { ProductList } from "@/components/vendor/product-list";
import { getVendorByUserId, getVendorProducts } from "@/lib/data/vendor";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Sản phẩm của tôi" };

export default async function VendorProductsPage() {
  const session = await auth();
  const vendor = await getVendorByUserId(session!.user.id);
  if (!vendor) return null;

  const products = await getVendorProducts(vendor.id);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sản phẩm của tôi</h1>
        <Link href="/vendor/products/new" className={cn(buttonVariants())}>
          + Thêm sản phẩm
        </Link>
      </div>
      <ProductList products={products} />
    </div>
  );
}
