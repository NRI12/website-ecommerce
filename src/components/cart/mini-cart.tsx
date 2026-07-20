"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MiniCartItem {
  id: string;
  quantity: number;
  product: { slug: string; name: string; images: { url: string; alt: string | null }[] };
  variant: { price: number };
}

export function MiniCart({ items, subtotal, itemCount }: { items: MiniCartItem[]; subtotal: number; itemCount: number }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Giỏ hàng" className="relative">
            <ShoppingCart className="size-5" />
            {itemCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            ) : null}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80 p-3">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Giỏ hàng của bạn đang trống.</p>
        ) : (
          <>
            <div className="max-h-80 space-y-1 overflow-y-auto">
              {items.slice(0, 5).map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  className="h-auto"
                  render={<Link href={`/products/${item.product.slug}`} />}
                >
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                    {item.product.images[0] ? (
                      <Image src={item.product.images[0].url} alt="" fill className="object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      SL: {item.quantity} · {formatCurrency(item.variant.price)}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
            {items.length > 5 ? (
              <p className="mt-2 text-center text-xs text-muted-foreground">và {items.length - 5} sản phẩm khác</p>
            ) : null}
            <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
              <span className="text-muted-foreground">Tạm tính</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <DropdownMenuItem
                className="justify-center p-0"
                render={
                  <Link href="/cart" className={cn(buttonVariants({ variant: "outline", size: "sm" }))} />
                }
              >
                Xem giỏ hàng
              </DropdownMenuItem>
              <DropdownMenuItem
                className="justify-center p-0"
                render={<Link href="/checkout" className={cn(buttonVariants({ size: "sm" }))} />}
              >
                Thanh toán
              </DropdownMenuItem>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
