import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

const NAV_ITEMS = [
  { href: "/admin", label: "Tổng quan" },
  { href: "/admin/vendors", label: "Gian hàng" },
  { href: "/admin/orders", label: "Đơn hàng" },
  { href: "/admin/coupons", label: "Mã giảm giá" },
  { href: "/admin/users", label: "Người dùng" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/login");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <DashboardNav items={NAV_ITEMS} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
