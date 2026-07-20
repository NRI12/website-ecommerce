import type { Metadata } from "next";
import { ProductForm } from "@/components/vendor/product-form";
import { getCategories } from "@/lib/data/products";

export const metadata: Metadata = { title: "Thêm sản phẩm" };

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Thêm sản phẩm mới</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
