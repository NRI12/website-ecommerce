import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { formatCurrency } from "@/lib/format";
import { getPlatformStats, getRevenueByDay } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Quản trị" };

export default async function AdminDashboardPage() {
  const [stats, revenueByDay] = await Promise.all([getPlatformStats(), getRevenueByDay(14)]);

  const cards = [
    { label: "Người dùng", value: stats.userCount },
    { label: "Gian hàng đã duyệt", value: stats.vendorCount },
    { label: "Đơn hàng", value: stats.orderCount },
    { label: "Doanh thu", value: formatCurrency(stats.revenue) },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Tổng quan nền tảng</h1>
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
