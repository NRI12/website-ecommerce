"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { toggleCouponActiveAction } from "@/lib/actions/admin-actions";

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  active: boolean;
  usedCount: number;
  usageLimit: number | null;
  vendor: { storeName: string } | null;
}

export function CouponList({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle(id: string, active: boolean) {
    startTransition(async () => {
      await toggleCouponActiveAction(id, active);
      router.refresh();
    });
  }

  if (coupons.length === 0) {
    return <p className="text-muted-foreground">Chưa có mã giảm giá nào.</p>;
  }

  return (
    <div className="grid gap-2">
      {coupons.map((coupon) => (
        <div key={coupon.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
          <div>
            <span className="font-mono font-medium">{coupon.code}</span>{" "}
            <span className="text-muted-foreground">
              · {coupon.type === "PERCENT" ? `${coupon.value}%` : formatCurrency(coupon.value)} ·{" "}
              {coupon.usedCount}/{coupon.usageLimit ?? "∞"} lượt · {coupon.vendor?.storeName ?? "Toàn sàn"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={coupon.active ? "secondary" : "outline"}>
              {coupon.active ? "Đang bật" : "Đã tắt"}
            </Badge>
            <Button size="sm" variant="outline" disabled={isPending} onClick={() => toggle(coupon.id, !coupon.active)}>
              {coupon.active ? "Tắt" : "Bật"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
