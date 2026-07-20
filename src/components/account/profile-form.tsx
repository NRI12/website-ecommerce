"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "@/lib/actions/profile-actions";

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateProfileAction({
        name: String(formData.get("name")),
        phone: String(formData.get("phone") ?? "") || undefined,
      });
      if (result.success) {
        toast.success("Đã cập nhật hồ sơ.");
      } else {
        toast.error(result.message ?? "Có lỗi xảy ra.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div>
        <Label htmlFor="name" className="mb-2">Họ và tên</Label>
        <Input id="name" name="name" defaultValue={name} required />
      </div>
      <div>
        <Label htmlFor="phone" className="mb-2">Số điện thoại</Label>
        <Input id="phone" name="phone" defaultValue={phone} />
      </div>
      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Đang lưu..." : "Lưu thay đổi"}
      </Button>
    </form>
  );
}
