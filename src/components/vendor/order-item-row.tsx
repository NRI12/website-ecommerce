"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/format";
import { updateFulfillmentStatusAction } from "@/lib/actions/product-actions";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "PACKED", label: "Đã đóng gói" },
  { value: "SHIPPED", label: "Đang giao" },
  { value: "DELIVERED", label: "Đã giao" },
  { value: "CANCELLED", label: "Đã hủy" },
] as const;

interface OrderItemRowProps {
  item: {
    id: string;
    productNameSnapshot: string;
    quantity: number;
    subtotal: number;
    fulfillmentStatus: string;
    order: { orderNumber: string; createdAt: Date; address: { fullName: string; city: string; province: string } };
  };
}

export function OrderItemRow({ item }: OrderItemRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(status: string | null) {
    if (!status) return;
    startTransition(async () => {
      await updateFulfillmentStatusAction(item.id, status as (typeof STATUS_OPTIONS)[number]["value"]);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm">
        <p className="font-medium">
          #{item.order.orderNumber} · {item.productNameSnapshot} × {item.quantity}
        </p>
        <p className="text-muted-foreground">
          {item.order.address.fullName} · {item.order.address.city}, {item.order.address.province} ·{" "}
          {formatDate(item.order.createdAt)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
        <Select
          items={STATUS_OPTIONS}
          value={item.fulfillmentStatus}
          onValueChange={handleChange}
          disabled={isPending}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
