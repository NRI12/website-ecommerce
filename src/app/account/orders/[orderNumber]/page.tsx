import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { CancelOrderButton } from "@/components/account/cancel-order-button";
import { OrderTimeline } from "@/components/account/order-timeline";
import { formatCurrency, formatDate } from "@/lib/format";
import { getOrderByNumberForUser } from "@/lib/data/orders";
import { verifyPendingStripeOrder } from "@/lib/orders";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_PROVIDER_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/order-labels";

export const metadata: Metadata = { title: "Chi tiết đơn hàng" };

interface OrderDetailPageProps {
  params: Promise<{ orderNumber: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { orderNumber } = await params;
  const session = await auth();
  if (!session?.user) return null;

  let order = await getOrderByNumberForUser(orderNumber, session.user.id);
  if (!order) notFound();

  if (await verifyPendingStripeOrder(order)) {
    order = await getOrderByNumberForUser(orderNumber, session.user.id);
    if (!order) notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Đơn hàng #{order.orderNumber}</h1>
        <div className="flex items-center gap-3">
          <Badge variant="outline">{ORDER_STATUS_LABELS[order.status] ?? order.status}</Badge>
          {order.status === "PENDING" ? <CancelOrderButton orderId={order.id} /> : null}
        </div>
      </div>

      <div className="mb-6 rounded-lg border p-4">
        <OrderTimeline status={order.status} />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4 text-sm">
          <h2 className="mb-2 font-semibold">Địa chỉ giao hàng</h2>
          <p>{order.address.fullName} · {order.address.phone}</p>
          <p className="text-muted-foreground">
            {order.address.line1}, {order.address.ward ? `${order.address.ward}, ` : ""}
            {order.address.city}, {order.address.province}
          </p>
        </div>
        <div className="rounded-lg border p-4 text-sm">
          <h2 className="mb-2 font-semibold">Thanh toán</h2>
          <p>{PAYMENT_PROVIDER_LABELS[order.paymentProvider] ?? order.paymentProvider}</p>
          <p className="text-muted-foreground">
            {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Đặt hàng lúc {formatDate(order.createdAt)}</p>
        </div>
      </div>

      <div className="rounded-lg border">
        {order.items.map((item) => (
          <div key={item.id} className="flex gap-3 border-b p-4 last:border-b-0">
            <Link
              href={`/products/${item.product.slug}`}
              className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted"
            >
              {item.product.images[0] ? (
                <Image src={item.product.images[0].url} alt="" fill className="object-cover" />
              ) : null}
            </Link>
            <div className="flex flex-1 flex-col justify-center text-sm">
              <span className="font-medium">{item.productNameSnapshot}</span>
              <span className="text-muted-foreground">
                {item.vendor.storeName} · SL: {item.quantity}
              </span>
            </div>
            <span className="self-center font-medium">{formatCurrency(item.subtotal, order.currency)}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tạm tính</span>
          <span>{formatCurrency(order.subtotal, order.currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Phí vận chuyển</span>
          <span>{formatCurrency(order.shippingFee, order.currency)}</span>
        </div>
        {order.discountTotal > 0 ? (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Giảm giá</span>
            <span>-{formatCurrency(order.discountTotal, order.currency)}</span>
          </div>
        ) : null}
        <div className="flex justify-between border-t pt-2 font-semibold">
          <span>Tổng cộng</span>
          <span>{formatCurrency(order.total, order.currency)}</span>
        </div>
      </div>
    </div>
  );
}
