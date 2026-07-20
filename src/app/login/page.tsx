import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <Link href="/" className="mx-auto mb-6 flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        S
      </Link>
      <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="mb-6 text-center text-2xl font-semibold">Đăng nhập</h1>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-medium text-foreground hover:underline">
          Đăng ký
        </Link>
      </p>
    </div>
  );
}
