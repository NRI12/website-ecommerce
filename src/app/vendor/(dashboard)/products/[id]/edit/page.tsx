import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { ProductForm } from "@/components/vendor/product-form";
import { getCategories } from "@/lib/data/products";
import { getVendorByUserId, getVendorProductById } from "@/lib/data/vendor";

export const metadata: Metadata = { title: "Sửa sản phẩm" };

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const session = await auth();
  const vendor = await getVendorByUserId(session!.user.id);
  if (!vendor) return null;

  const [product, categories] = await Promise.all([
    getVendorProductById(vendor.id, id),
    getCategories(),
  ]);
  if (!product) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Sửa sản phẩm</h1>
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
