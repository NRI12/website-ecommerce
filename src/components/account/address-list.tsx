"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteAddressAction } from "@/lib/actions/address-actions";

interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  ward: string | null;
  city: string;
  province: string;
  isDefault: boolean;
}

export function AddressList({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteAddressAction(id);
      router.refresh();
    });
  }

  if (addresses.length === 0) {
    return <p className="text-muted-foreground">Bạn chưa có địa chỉ nào.</p>;
  }

  return (
    <div className="grid gap-3">
      {addresses.map((address) => (
        <div key={address.id} className="flex items-start justify-between gap-4 rounded-lg border p-4 text-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{address.fullName}</span>
              {address.isDefault ? <Badge variant="secondary">Mặc định</Badge> : null}
            </div>
            <p className="text-muted-foreground">{address.phone}</p>
            <p className="text-muted-foreground">
              {address.line1}, {address.ward ? `${address.ward}, ` : ""}
              {address.city}, {address.province}
            </p>
          </div>
          <Button variant="ghost" size="sm" disabled={isPending} onClick={() => handleDelete(address.id)}>
            Xóa
          </Button>
        </div>
      ))}
    </div>
  );
}
