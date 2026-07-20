import type { Metadata } from "next";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { formatCurrency } from "@/lib/format";
import { getVendorByUserId, getVendorRevenueByDay, getVendorStats } from "@/lib/data/vendor";

export const metadata: Metadata = { title: "Tổng quan gian hàng" };

export default async function VendorDashboardPage() {
  const session = await auth();
  const vendor = await getVendorByUserId(session!.user.id);
  if (!vendor) return null;

  const [stats, revenueByDay] = await Promise.all([
    getVendorStats(vendor.id),
    getVendorRevenueByDay(vendor.id, 14),
  ]);

  const cards = [
    { label: "Sản phẩm", value: stats.productCount },
    { label: "Lượt bán", value: stats.orderItemCount },
    { label: "Chờ xử lý", value: stats.pendingItemCount },
    { label: "Doanh thu", value: formatCurrency(stats.revenue) },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Tổng quan</h1>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{card.value}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Doanh thu 14 ngày gần nhất</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={revenueByDay} />
        </CardContent>
      </Card>
    </div>
  );
}
