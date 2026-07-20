import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductCard } from "@/components/product/product-card";
import { ProductFilters } from "@/components/product/product-filters";
import { getCategoryBySlug, getProducts, type ProductSort } from "@/lib/data/products";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string; minPrice?: string; maxPrice?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  return { title: category?.name ?? "Danh mục" };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page: pageParam, sort, minPrice, maxPrice } = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const page = Math.max(1, Number(pageParam) || 1);
  const { products, total } = await getProducts({
    categorySlug: slug,
    sort: sort as ProductSort | undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    page,
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold">{category.name}</h1>
      <p className="mb-4 text-sm text-muted-foreground">{total} sản phẩm</p>

      <ProductFilters />

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">Chưa có sản phẩm trong danh mục này.</p>
      )}
    </div>
  );
}
