import type { Metadata } from "next";
import { auth } from "@/auth";
import { OrderItemRow } from "@/components/vendor/order-item-row";
import { getVendorByUserId, getVendorOrderItems } from "@/lib/data/vendor";

export const metadata: Metadata = { title: "Đơn hàng" };

export default async function VendorOrdersPage() {
  const session = await auth();
  const vendor = await getVendorByUserId(session!.user.id);
  if (!vendor) return null;

  const items = await getVendorOrderItems(vendor.id);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Đơn hàng</h1>
      {items.length === 0 ? (
        <p className="text-muted-foreground">Chưa có đơn hàng nào.</p>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <OrderItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
