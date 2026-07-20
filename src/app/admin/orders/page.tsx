import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { formatCurrency, formatDate } from "@/lib/format";
import { getAllOrders } from "@/lib/data/admin";
import { PAYMENT_STATUS_LABELS } from "@/lib/order-labels";

export const metadata: Metadata = { title: "Quản lý đơn hàng" };

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Đơn hàng</h1>
      {orders.length === 0 ? (
        <p className="text-muted-foreground">Chưa có đơn hàng nào.</p>
      ) : (
        <div className="grid gap-3">
          {orders.map((order) => (
            <div key={order.id} className="flex flex-col gap-2 rounded-lg border p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link href={`/account/orders/${order.orderNumber}`} className="font-medium hover:underline">
                  #{order.orderNumber}
                </Link>
                <p className="text-muted-foreground">
                  {order.user.name} · {order.user.email} · {formatDate(order.createdAt)}
                </p>
                <Badge variant="outline" className="mt-1">
                  {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{formatCurrency(order.total, order.currency)}</span>
                <OrderStatusSelect orderId={order.id} status={order.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
