import type { Metadata } from "next";
import { CouponForm } from "@/components/admin/coupon-form";
import { CouponList } from "@/components/admin/coupon-list";
import { getAllCoupons } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Mã giảm giá" };

export default async function AdminCouponsPage() {
  const coupons = await getAllCoupons();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Mã giảm giá</h1>
      <div className="mb-6">
        <CouponForm />
      </div>
      <CouponList coupons={coupons} />
    </div>
  );
}
