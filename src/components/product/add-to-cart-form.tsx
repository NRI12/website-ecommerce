"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { addToCartAction } from "@/lib/actions/cart-actions";
import { cn } from "@/lib/utils";

interface Variant {
  id: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  attributes: Record<string, string>;
}

export function AddToCartForm({
  productId,
  variants,
}: {
  productId: string;
  variants: Variant[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(1);

  const attributeKeys = useMemo(() => {
    const keys = new Set<string>();
    variants.forEach((v) => Object.keys(v.attributes ?? {}).forEach((k) => keys.add(k)));
    return Array.from(keys);
  }, [variants]);

  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    const inStockFirst = variants.find((v) => v.stock > 0) ?? variants[0];
    if (inStockFirst) {
      attributeKeys.forEach((key) => {
        initial[key] = inStockFirst.attributes[key];
      });
    }
    return initial;
  });

  const activeVariant = useMemo(() => {
    return variants.find((v) =>
      attributeKeys.every((key) => v.attributes[key] === selected[key]),
    );
  }, [variants, attributeKeys, selected]);

  function optionsFor(key: string) {
    const values = new Set<string>();
    variants.forEach((v) => {
      if (v.attributes[key]) values.add(v.attributes[key]);
    });
    return Array.from(values);
  }

  function stockForOption(key: string, value: string) {
    const candidate = { ...selected, [key]: value };
    const match = variants.find((v) => attributeKeys.every((k) => v.attributes[k] === candidate[k]));
    return match?.stock ?? 0;
  }

  function handleAddToCart() {
    if (!activeVariant) return;
    startTransition(async () => {
      const result = await addToCartAction({
        productId,
        variantId: activeVariant.id,
        quantity,
      });
      if (result.success) {
        toast.success("Đã thêm vào giỏ hàng.");
        router.refresh();
      } else {
        toast.error(result.message ?? "Có lỗi xảy ra.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold">
          {formatCurrency(activeVariant?.price ?? variants[0]?.price ?? 0)}
        </span>
        {activeVariant?.compareAtPrice ? (
          <span className="text-muted-foreground line-through">
            {formatCurrency(activeVariant.compareAtPrice)}
          </span>
        ) : null}
      </div>

      {attributeKeys.map((key) => (
        <div key={key}>
          <p className="mb-2 text-sm font-medium capitalize">{key}</p>
          <div className="flex flex-wrap gap-2">
            {optionsFor(key).map((value) => {
              const outOfStock = stockForOption(key, value) < 1;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={outOfStock}
                  onClick={() => setSelected((prev) => ({ ...prev, [key]: value }))}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm transition-colors",
                    selected[key] === value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                    outOfStock && "cursor-not-allowed opacity-40 line-through hover:bg-transparent",
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-md border">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Minus className="size-4" />
          </Button>
          <span className="w-10 text-center text-sm">{quantity}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setQuantity((q) => Math.min(activeVariant?.stock ?? 99, q + 1))}
          >
            <Plus className="size-4" />
          </Button>
        </div>
        <span className="text-sm text-muted-foreground">
          {activeVariant && activeVariant.stock > 0 ? `Còn ${activeVariant.stock} sản phẩm` : "Hết hàng"}
        </span>
      </div>

      <Button
        size="lg"
        disabled={!activeVariant || activeVariant.stock < 1 || isPending}
        onClick={handleAddToCart}
      >
        {isPending ? "Đang thêm..." : "Thêm vào giỏ hàng"}
      </Button>
    </div>
  );
}
