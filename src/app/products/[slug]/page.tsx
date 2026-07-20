import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";
import { AddToCartForm } from "@/components/product/add-to-cart-form";
import { ProductCard } from "@/components/product/product-card";
import { ProductImageGallery } from "@/components/product/product-image-gallery";
import { RecentlyViewedList, RecentlyViewedTracker } from "@/components/product/recently-viewed";
import { ReviewForm } from "@/components/product/review-form";
import { WishlistButton } from "@/components/product/wishlist-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth } from "@/auth";
import { formatDate } from "@/lib/format";
import { getFrequentlyBoughtTogether, getProductBySlug, getRelatedProducts } from "@/lib/data/products";
import { canReviewProduct } from "@/lib/actions/review-actions";
import { isProductWishlisted } from "@/lib/data/wishlist";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Sản phẩm" };

  const description = product.description.slice(0, 160);
  const imageUrl = product.images[0]?.url;

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
      type: "website",
    },
    alternates: { canonical: `${APP_URL}/products/${product.slug}` },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const session = await auth();
  const [relatedProducts, boughtTogether, wishlisted, reviewEligible] = await Promise.all([
    getRelatedProducts(product.id, product.categoryId),
    getFrequentlyBoughtTogether(product.id),
    isProductWishlisted(session?.user?.id, product.id),
    canReviewProduct(product.id, session?.user?.id),
  ]);

  const minPrice = product.variants.length ? Math.min(...product.variants.map((v) => v.price)) : 0;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => i.url),
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: product.vendor.storeName },
    aggregateRating:
      product.ratingCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.ratingAvg,
            reviewCount: product.ratingCount,
          }
        : undefined,
    offers: {
      "@type": "Offer",
      url: `${APP_URL}/products/${product.slug}`,
      priceCurrency: "VND",
      price: minPrice,
      availability: product.variants.some((v) => v.stock > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  const variants = product.variants.map((v) => ({
    id: v.id,
    price: v.price,
    compareAtPrice: v.compareAtPrice,
    stock: v.stock,
    attributes: (v.attributes ?? {}) as Record<string, string>,
  }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <RecentlyViewedTracker
        item={{ slug: product.slug, name: product.name, imageUrl: product.images[0]?.url ?? null, price: minPrice }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/">Trang chủ</Link> /{" "}
        <Link href={`/categories/${product.category.slug}`}>{product.category.name}</Link> /{" "}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductImageGallery images={product.images} productName={product.name} />

        <div>
          <Link
            href={`/vendors/${product.vendor.slug}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            {product.vendor.storeName}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">{product.name}</h1>
          {product.ratingCount > 0 ? (
            <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              {product.ratingAvg.toFixed(1)} ({product.ratingCount} đánh giá)
            </div>
          ) : null}

          <div className="mt-6 flex items-start gap-3">
            <div className="flex-1">
              <AddToCartForm productId={product.id} variants={variants} />
            </div>
            <WishlistButton
              productId={product.id}
              initialWishlisted={wishlisted}
              isAuthenticated={Boolean(session?.user)}
            />
          </div>

          <div className="mt-8 border-t pt-6">
            <h2 className="mb-2 font-semibold">Mô tả sản phẩm</h2>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{product.description}</p>
          </div>
        </div>
      </div>

      <section className="mt-12 border-t pt-8">
        <h2 className="mb-4 text-xl font-semibold">Đánh giá từ khách hàng</h2>
        {reviewEligible ? (
          <div className="mb-6">
            <ReviewForm productId={product.id} />
          </div>
        ) : null}
        {product.reviews.length > 0 ? (
          <div className="grid gap-4">
            {product.reviews.map((review) => (
              <div key={review.id} className="flex gap-3 border-b pb-4">
                <Avatar>
                  <AvatarImage src={review.user.image ?? undefined} />
                  <AvatarFallback>{review.user.name?.[0] ?? "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{review.user.name ?? "Khách hàng"}</span>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`size-3.5 ${
                            i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
                  {review.comment ? <p className="mt-2 text-sm">{review.comment}</p> : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Chưa có đánh giá nào cho sản phẩm này.</p>
        )}
      </section>

      {boughtTogether.length > 0 ? (
        <section className="mt-12 border-t pt-8">
          <h2 className="mb-4 text-xl font-semibold">Thường được mua cùng</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {boughtTogether.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}

      {relatedProducts.length > 0 ? (
        <section className="mt-12 border-t pt-8">
          <h2 className="mb-4 text-xl font-semibold">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((related) => (
              <ProductCard key={related.id} product={related} />
            ))}
          </div>
        </section>
      ) : null}

      <RecentlyViewedList excludeSlug={product.slug} />
    </div>
  );
}
