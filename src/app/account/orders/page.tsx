import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { getOrdersForUser } from "@/lib/data/orders";
import { ORDER_STATUS_LABELS } from "@/lib/order-labels";

export const metadata: Metadata = { title: "Đơn hàng của tôi" };

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) return null;

  const orders = await getOrdersForUser(session.user.id);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Đơn hàng của tôi</h1>

      {orders.length === 0 ? (
        <p className="text-muted-foreground">Bạn chưa có đơn hàng nào.</p>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.orderNumber}`}
              className="rounded-lg border p-4 transition-colors hover:bg-muted/40"
            >
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-medium">#{order.orderNumber}</span>
                <Badge variant="outline">{ORDER_STATUS_LABELS[order.status] ?? order.status}</Badge>
              </div>
              <div className="flex gap-2">
                {order.items.slice(0, 4).map((item) => (
                  <div key={item.id} className="relative size-14 overflow-hidden rounded-md bg-muted">
                    {item.product.images[0] ? (
                      <Image src={item.product.images[0].url} alt="" fill className="object-cover" />
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{formatDate(order.createdAt)}</span>
                <span className="font-semibold">{formatCurrency(order.total, order.currency)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
