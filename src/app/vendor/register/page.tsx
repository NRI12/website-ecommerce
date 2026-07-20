import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { RegisterVendorForm } from "@/components/vendor/register-vendor-form";

export const metadata: Metadata = { title: "Đăng ký bán hàng" };

export default async function VendorRegisterPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/vendor/register");

  const existing = await db.vendor.findUnique({ where: { userId: session.user.id } });
  if (existing) redirect("/vendor");

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-4 py-16">
      <h1 className="mb-2 text-2xl font-semibold">Đăng ký bán hàng</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Gian hàng của bạn sẽ được xét duyệt trước khi sản phẩm hiển thị công khai.
      </p>
      <RegisterVendorForm />
    </div>
  );
}
