"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cancelOrderAction } from "@/lib/actions/order-actions";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCancel() {
    if (!window.confirm("Bạn chắc chắn muốn hủy đơn hàng này?")) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelOrderAction(orderId);
      if (!result.success) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <Button type="button" variant="destructive" size="sm" disabled={isPending} onClick={handleCancel}>
        {isPending ? "Đang hủy..." : "Hủy đơn hàng"}
      </Button>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
