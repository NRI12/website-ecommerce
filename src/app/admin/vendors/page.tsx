import type { Metadata } from "next";
import { VendorList } from "@/components/admin/vendor-list";
import { getAllVendors } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Quản lý gian hàng" };

export default async function AdminVendorsPage() {
  const vendors = await getAllVendors();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Gian hàng</h1>
      {vendors.length === 0 ? (
        <p className="text-muted-foreground">Chưa có gian hàng nào đăng ký.</p>
      ) : (
        <VendorList vendors={vendors} />
      )}
    </div>
  );
}
