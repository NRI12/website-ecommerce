import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { ProductFilters } from "@/components/product/product-filters";
import { buttonVariants } from "@/components/ui/button";
import { getProducts, type ProductSort } from "@/lib/data/products";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Tất cả sản phẩm" };

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    page?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const { products, total, totalPages } = await getProducts({
    search: params.search,
    categorySlug: params.category,
    sort: params.sort as ProductSort | undefined,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    page,
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold">
        {params.search ? `Kết quả cho "${params.search}"` : "Tất cả sản phẩm"}
      </h1>
      <p className="mb-4 text-sm text-muted-foreground">{total} sản phẩm</p>

      <ProductFilters />

      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="mt-8 flex items-center justify-center gap-2">
              <PaginationLink href={buildPageHref(params, page - 1)} disabled={page <= 1}>
                Trước
              </PaginationLink>
              <span className="text-sm text-muted-foreground">
                Trang {page} / {totalPages}
              </span>
              <PaginationLink href={buildPageHref(params, page + 1)} disabled={page >= totalPages}>
                Sau
              </PaginationLink>
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-muted-foreground">Không tìm thấy sản phẩm nào phù hợp.</p>
      )}
    </div>
  );
}

function PaginationLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className={cn(buttonVariants({ variant: "outline", size: "sm" }), "pointer-events-none opacity-50")}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
      {children}
    </Link>
  );
}

function buildPageHref(
  params: { search?: string; category?: string; sort?: string; minPrice?: string; maxPrice?: string },
  page: number,
) {
  const search = new URLSearchParams();
  if (params.search) search.set("search", params.search);
  if (params.category) search.set("category", params.category);
  if (params.sort) search.set("sort", params.sort);
  if (params.minPrice) search.set("minPrice", params.minPrice);
  if (params.maxPrice) search.set("maxPrice", params.maxPrice);
  search.set("page", String(page));
  return `/products?${search.toString()}`;
}
