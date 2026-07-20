import Link from "next/link";
import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CartItemRow } from "@/components/cart/cart-item-row";
import { formatCurrency } from "@/lib/format";
import { getCartWithItems } from "@/lib/cart";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Giỏ hàng" };

export default async function CartPage() {
  const cart = await getCartWithItems();
  const items = cart?.items ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Giỏ hàng</h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed p-12 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="size-6 text-muted-foreground" />
          </div>
          <p className="mb-4 text-muted-foreground">Giỏ hàng của bạn đang trống.</p>
          <Link href="/products" className={cn(buttonVariants())}>
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="divide-y rounded-xl border bg-card shadow-sm lg:col-span-2">
            {items.map((item) => (
              <CartItemRow key={item.id} item={item} />
            ))}
          </div>

          <div className="h-fit rounded-xl border bg-card p-4 shadow-sm">
            <h2 className="mb-4 font-semibold">Tóm tắt đơn hàng</h2>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tạm tính</span>
              <span className="font-medium">{formatCurrency(cart?.subtotal ?? 0)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Phí vận chuyển và thuế được tính ở bước thanh toán.
            </p>
            <Link href="/checkout" className={cn(buttonVariants({ size: "lg" }), "mt-4 w-full")}>
              Tiến hành thanh toán
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
