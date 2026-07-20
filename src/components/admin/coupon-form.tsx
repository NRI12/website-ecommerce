"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCouponAction } from "@/lib/actions/admin-actions";

const COUPON_TYPE_LABELS: Record<string, string> = {
  PERCENT: "Phần trăm (%)",
  FIXED: "Số tiền cố định",
};

export function CouponForm() {
  const router = useRouter();
  const [type, setType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createCouponAction({
        code: String(formData.get("code")),
        type,
        value: Number(formData.get("value")),
        minOrderAmount: formData.get("minOrderAmount") ? Number(formData.get("minOrderAmount")) : undefined,
        maxDiscount: formData.get("maxDiscount") ? Number(formData.get("maxDiscount")) : undefined,
        usageLimit: formData.get("usageLimit") ? Number(formData.get("usageLimit")) : undefined,
        expiresAt: formData.get("expiresAt") ? String(formData.get("expiresAt")) : undefined,
      });
      if (!result.success) {
        setError(result.message ?? "Có lỗi xảy ra.");
        return;
      }
      (e.target as HTMLFormElement).reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-3">
      <div>
        <Label htmlFor="code" className="mb-2">Mã</Label>
        <Input id="code" name="code" required placeholder="SALE10" />
      </div>
      <div>
        <Label className="mb-2">Loại</Label>
        <Select
          items={COUPON_TYPE_LABELS}
          value={type}
          onValueChange={(v) => setType((v as "PERCENT" | "FIXED") ?? "PERCENT")}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PERCENT">Phần trăm (%)</SelectItem>
            <SelectItem value="FIXED">Số tiền cố định</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="value" className="mb-2">Giá trị</Label>
        <Input id="value" name="value" type="number" required />
      </div>
      <div>
        <Label htmlFor="minOrderAmount" className="mb-2">Đơn tối thiểu</Label>
        <Input id="minOrderAmount" name="minOrderAmount" type="number" />
      </div>
      <div>
        <Label htmlFor="maxDiscount" className="mb-2">Giảm tối đa</Label>
        <Input id="maxDiscount" name="maxDiscount" type="number" />
      </div>
      <div>
        <Label htmlFor="usageLimit" className="mb-2">Số lượt dùng</Label>
        <Input id="usageLimit" name="usageLimit" type="number" />
      </div>
      <div>
        <Label htmlFor="expiresAt" className="mb-2">Hết hạn</Label>
        <Input id="expiresAt" name="expiresAt" type="date" />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Đang tạo..." : "Tạo mã"}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive sm:col-span-3">{error}</p> : null}
    </form>
  );
}
