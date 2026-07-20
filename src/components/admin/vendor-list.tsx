"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { approveVendorAction, suspendVendorAction } from "@/lib/actions/vendor-actions";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  SUSPENDED: "Đã khóa",
};

interface Vendor {
  id: string;
  storeName: string;
  status: string;
  user: { name: string | null; email: string | null };
  _count: { products: number };
}

export function VendorList({ vendors }: { vendors: Vendor[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handle(action: (id: string) => Promise<unknown>, id: string) {
    startTransition(async () => {
      await action(id);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-3">
      {vendors.map((vendor) => (
        <div key={vendor.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{vendor.storeName}</span>
              <Badge variant="outline">{STATUS_LABELS[vendor.status] ?? vendor.status}</Badge>
            </div>
            <p className="text-muted-foreground">
              {vendor.user.name} · {vendor.user.email} · {vendor._count.products} sản phẩm
            </p>
          </div>
          <div className="flex gap-2">
            {vendor.status !== "APPROVED" ? (
              <Button size="sm" disabled={isPending} onClick={() => handle(approveVendorAction, vendor.id)}>
                Duyệt
              </Button>
            ) : null}
            {vendor.status !== "SUSPENDED" ? (
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handle(suspendVendorAction, vendor.id)}
              >
                Khóa
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
