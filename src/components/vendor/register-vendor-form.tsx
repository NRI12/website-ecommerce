"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { registerVendorAction } from "@/lib/actions/vendor-actions";

export function RegisterVendorForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await registerVendorAction({
        storeName: String(formData.get("storeName")),
        description: String(formData.get("description") ?? "") || undefined,
      });
      if (!result.success) {
        setError(result.message ?? "Có lỗi xảy ra.");
        return;
      }
      router.push("/vendor");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div>
        <Label htmlFor="storeName" className="mb-2">Tên gian hàng</Label>
        <Input id="storeName" name="storeName" required />
      </div>
      <div>
        <Label htmlFor="description" className="mb-2">Giới thiệu ngắn</Label>
        <Textarea id="description" name="description" rows={4} />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Đang gửi..." : "Đăng ký gian hàng"}
      </Button>
    </form>
  );
}
