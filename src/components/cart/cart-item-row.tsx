"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { removeCartItemAction, updateCartItemQuantityAction } from "@/lib/actions/cart-actions";

interface CartItemRowProps {
  item: {
    id: string;
    quantity: number;
    product: { slug: string; name: string; images: { url: string; alt: string | null }[] };
    variant: { price: number; stock: number; attributes: unknown };
  };
}

export function CartItemRow({ item }: CartItemRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const attributes = (item.variant.attributes ?? {}) as Record<string, string>;
  const image = item.product.images[0];

  function changeQuantity(nextQuantity: number) {
    if (nextQuantity < 1) return;
    startTransition(async () => {
      await updateCartItemQuantityAction({ itemId: item.id, quantity: nextQuantity });
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await removeCartItemAction(item.id);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-4 p-4">
      <Link href={`/products/${item.product.slug}`} className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
        {image ? (
          <Image src={image.url} alt={image.alt ?? item.product.name} fill className="object-cover" />
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col">
        <Link href={`/products/${item.product.slug}`} className="text-sm font-medium hover:underline">
          {item.product.name}
        </Link>
        <p className="text-xs text-muted-foreground">
          {Object.entries(attributes).map(([k, v]) => `${k}: ${v}`).join(", ")}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center rounded-md border">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isPending}
              onClick={() => changeQuantity(item.quantity - 1)}
            >
              <Minus className="size-4" />
            </Button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isPending || item.quantity >= item.variant.stock}
              onClick={() => changeQuantity(item.quantity + 1)}
            >
              <Plus className="size-4" />
            </Button>
          </div>
          <span className="font-semibold">{formatCurrency(item.variant.price * item.quantity)}</span>
        </div>
      </div>
      <Button type="button" variant="ghost" size="icon" disabled={isPending} onClick={remove} aria-label="Xóa">
        <Trash2 className="size-4 text-muted-foreground" />
      </Button>
    </div>
  );
}
