"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction } from "@/lib/actions/auth-actions";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name"));
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const confirmPassword = String(formData.get("confirmPassword"));

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    startTransition(async () => {
      const result = await registerAction({ name, email, password });
      if (!result.success) {
        setError(result.message ?? "Có lỗi xảy ra.");
        return;
      }
      const signInResult = await signIn("credentials", { email, password, redirect: false });
      if (signInResult?.error) {
        router.push("/login");
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="name" className="mb-2">Họ và tên</Label>
        <Input id="name" name="name" required autoComplete="name" />
      </div>
      <div>
        <Label htmlFor="email" className="mb-2">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="password" className="mb-2">Mật khẩu</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      <div>
        <Label htmlFor="confirmPassword" className="mb-2">Xác nhận mật khẩu</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Đang tạo tài khoản..." : "Đăng ký"}
      </Button>
    </form>
  );
}
