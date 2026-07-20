"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    startTransition(async () => {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Email hoặc mật khẩu không đúng.");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="email" className="mb-2">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label htmlFor="password">Mật khẩu</Label>
            <Link href="/forgot-password" className="text-xs text-muted-foreground hover:underline">
              Quên mật khẩu?
            </Link>
          </div>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </form>

      <div className="relative text-center text-xs text-muted-foreground">
        <span className="bg-background px-2">hoặc</span>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => signIn("google", { callbackUrl })}
      >
        Tiếp tục với Google
      </Button>
    </div>
  );
}
