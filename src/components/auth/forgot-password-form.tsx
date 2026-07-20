"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordResetAction } from "@/lib/actions/password-reset-actions";

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email"));

    startTransition(async () => {
      await requestPasswordResetAction(email);
      setSent(true);
    });
  }

  if (sent) {
    return (
      <p className="text-sm text-muted-foreground">
        Nếu email này đã đăng ký, chúng tôi đã gửi liên kết đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="email" className="mb-2">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Đang gửi..." : "Gửi liên kết đặt lại mật khẩu"}
      </Button>
    </form>
  );
}
