import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const NAV_ITEMS = [
  { href: "/vendor", label: "Tổng quan" },
  { href: "/vendor/products", label: "Sản phẩm" },
  { href: "/vendor/orders", label: "Đơn hàng" },
];

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const vendor = await db.vendor.findUnique({ where: { userId: session.user.id } });

  if (!vendor) {
    if (session.user.role === "ADMIN") {
      return (
        <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
          <p className="mb-4 text-muted-foreground">
            Tài khoản quản trị viên không có gian hàng. Quản lý nền tảng tại trang admin.
          </p>
          <Link href="/admin" className="text-sm font-medium text-primary hover:underline">
            Đi tới trang quản trị
          </Link>
        </div>
      );
    }
    redirect("/vendor/register");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      {vendor.status !== "APPROVED" ? (
        <Alert className="mb-6">
          <AlertTitle>
            {vendor.status === "PENDING" ? "Gian hàng đang chờ duyệt" : "Gian hàng đã bị tạm khóa"}
          </AlertTitle>
          <AlertDescription>
            {vendor.status === "PENDING"
              ? "Sản phẩm của bạn sẽ chỉ hiển thị công khai sau khi quản trị viên phê duyệt gian hàng."
              : "Vui lòng liên hệ quản trị viên để biết thêm chi tiết."}
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-6 lg:flex-row">
        <DashboardNav items={NAV_ITEMS} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
