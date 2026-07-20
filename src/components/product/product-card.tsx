import Image from "next/image";
import Link from "next/link";
import { Star, Store } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { ProductCard as ProductCardData } from "@/lib/data/products";

export function ProductCard({ product }: { product: ProductCardData }) {
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.minPrice;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.minPrice / product.compareAtPrice!) * 100)
    : null;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-primary/30"
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/50">
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt ?? product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            Không có ảnh
          </div>
        )}
        {discountPercent ? (
          <span className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
            -{discountPercent}%
          </span>
        ) : null}
        {product.lowStock ? (
          <span className="absolute bottom-2 left-2 rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
            Sắp hết hàng
          </span>
        ) : null}
        {!product.inStock ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold text-white">
            Hết hàng
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {product.category.name}
        </span>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-tight text-foreground">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-1.5 pt-1">
          <span className="text-base font-bold text-primary">{formatCurrency(product.minPrice)}</span>
          {hasDiscount ? (
            <span className="text-xs text-muted-foreground line-through">
              {formatCurrency(product.compareAtPrice!)}
            </span>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <span className="flex min-w-0 items-center gap-1 truncate">
            <Store className="size-3 shrink-0" />
            <span className="truncate">{product.vendor.storeName}</span>
          </span>
          {product.ratingCount > 0 ? (
            <span className="flex shrink-0 items-center gap-0.5">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              {product.ratingAvg.toFixed(1)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
