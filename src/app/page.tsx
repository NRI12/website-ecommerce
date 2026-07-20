import Link from "next/link";
import { ShieldCheck, Truck, RotateCcw, Headset, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { SectionHeader } from "@/components/product/section-header";
import { getCategories, getFeaturedProducts, getNewArrivals } from "@/lib/data/products";
import { getCategoryIcon } from "@/lib/category-icons";
import { cn } from "@/lib/utils";

const TRUST_BADGES = [
  { icon: Truck, label: "Miễn phí giao hàng", detail: "Cho đơn từ 500.000đ" },
  { icon: ShieldCheck, label: "Thanh toán an toàn", detail: "Stripe, COD" },
  { icon: RotateCcw, label: "Đổi trả dễ dàng", detail: "Trong vòng 7 ngày" },
  { icon: Headset, label: "Hỗ trợ 24/7", detail: "Luôn sẵn sàng hỗ trợ bạn" },
];

export default async function HomePage() {
  const [categories, featuredProducts, newArrivals] = await Promise.all([
    getCategories(),
    getFeaturedProducts(8),
    getNewArrivals(8),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <section className="relative mb-10 overflow-hidden rounded-3xl border bg-card p-8 text-center sm:p-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, color-mix(in oklch, var(--primary), transparent 88%) 0%, transparent 45%), radial-gradient(circle at 85% 75%, color-mix(in oklch, var(--accent-foreground), transparent 90%) 0%, transparent 45%)",
          }}
        />
        <span className="mb-4 inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          Nền tảng đa gian hàng
        </span>
        <h1 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
          Mua sắm từ hàng ngàn gian hàng uy tín
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground sm:text-lg">
          Giao hàng nhanh, thanh toán an toàn với thẻ quốc tế.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/products" className={cn(buttonVariants({ size: "lg" }), "group")}>
            Khám phá ngay
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/vendor/register"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }), "bg-background")}
          >
            Bán hàng cùng chúng tôi
          </Link>
        </div>
      </section>

      <section className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TRUST_BADGES.map((badge) => (
          <div
            key={badge.label}
            className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <badge.icon className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{badge.label}</p>
              <p className="text-xs text-muted-foreground">{badge.detail}</p>
            </div>
          </div>
        ))}
      </section>

      {categories.length > 0 ? (
        <section className="mb-10">
          <SectionHeader title="Danh mục nổi bật" />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {categories.slice(0, 12).map((category) => {
              const Icon = getCategoryIcon(category.slug);
              return (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group flex flex-col items-center gap-2.5 rounded-xl border bg-card p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/15">
                    <Icon className="size-6 text-primary" />
                  </div>
                  <span className="text-xs font-medium leading-tight">{category.name}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="mb-10">
        <SectionHeader title="Sản phẩm nổi bật" subtitle="Được đánh giá cao từ khách hàng" href="/products" />
        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            Chưa có sản phẩm nào. Hãy chạy seed dữ liệu mẫu để xem cửa hàng hoạt động.
          </p>
        )}
      </section>

      {newArrivals.length > 0 ? (
        <section>
          <SectionHeader title="Sản phẩm mới về" subtitle="Vừa được thêm vào cửa hàng" href="/products" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
