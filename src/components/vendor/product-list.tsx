"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { deleteProductAction } from "@/lib/actions/product-actions";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Nháp",
  ACTIVE: "Đang bán",
  ARCHIVED: "Ngừng bán",
};

interface VendorProduct {
  id: string;
  name: string;
  status: string;
  minPrice: number;
  totalStock: number;
  category: { name: string };
  images: { url: string }[];
}

export function ProductList({ products }: { products: VendorProduct[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm("Xóa sản phẩm này?")) return;
    startTransition(async () => {
      await deleteProductAction(id);
      router.refresh();
    });
  }

  if (products.length === 0) {
    return <p className="text-muted-foreground">Bạn chưa có sản phẩm nào.</p>;
  }

  return (
    <div className="grid gap-3">
      {products.map((product) => (
        <div key={product.id} className="flex items-center gap-3 rounded-lg border p-3">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
            {product.images[0] ? (
              <Image src={product.images[0].url} alt="" fill className="object-cover" />
            ) : null}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{product.name}</span>
              <Badge variant="outline">{STATUS_LABELS[product.status] ?? product.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {product.category.name} · {formatCurrency(product.minPrice)} · Tồn kho: {product.totalStock}
            </p>
          </div>
          <Link href={`/vendor/products/${product.id}/edit`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Sửa
          </Link>
          <Button variant="ghost" size="sm" disabled={isPending} onClick={() => handleDelete(product.id)}>
            Xóa
          </Button>
        </div>
      ))}
    </div>
  );
}
