"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateOrderStatusAction } from "@/lib/actions/admin-actions";
import { ORDER_STATUS_LABELS } from "@/lib/order-labels";

const STATUSES = Object.keys(ORDER_STATUS_LABELS);

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string | null) {
    if (!value) return;
    startTransition(async () => {
      await updateOrderStatusAction(orderId, value as Parameters<typeof updateOrderStatusAction>[1]);
      router.refresh();
    });
  }

  return (
    <Select items={ORDER_STATUS_LABELS} value={status} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {ORDER_STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
