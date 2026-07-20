"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAddressAction } from "@/lib/actions/address-actions";

export function AddressForm({ onCreated }: { onCreated: (addressId: string) => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createAddressAction({
        fullName: String(formData.get("fullName")),
        phone: String(formData.get("phone")),
        line1: String(formData.get("line1")),
        ward: String(formData.get("ward") ?? "") || undefined,
        city: String(formData.get("city")),
        province: String(formData.get("province")),
        isDefault: true,
      });
      if (!result.success || !result.addressId) {
        setError(result.message ?? "Không thể lưu địa chỉ.");
        return;
      }
      onCreated(result.addressId);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="fullName" className="mb-2">Họ và tên người nhận</Label>
          <Input id="fullName" name="fullName" required />
        </div>
        <div>
          <Label htmlFor="phone" className="mb-2">Số điện thoại</Label>
          <Input id="phone" name="phone" required />
        </div>
      </div>
      <div>
        <Label htmlFor="line1" className="mb-2">Địa chỉ</Label>
        <Input id="line1" name="line1" required placeholder="Số nhà, tên đường" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="ward" className="mb-2">Phường/Xã</Label>
          <Input id="ward" name="ward" />
        </div>
        <div>
          <Label htmlFor="city" className="mb-2">Quận/Huyện</Label>
          <Input id="city" name="city" required />
        </div>
        <div>
          <Label htmlFor="province" className="mb-2">Tỉnh/Thành phố</Label>
          <Input id="province" name="province" required />
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Đang lưu..." : "Lưu địa chỉ"}
      </Button>
    </form>
  );
}
