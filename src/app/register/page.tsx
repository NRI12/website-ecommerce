import Link from "next/link";
import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Đăng ký" };

export default function RegisterPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <Link href="/" className="mx-auto mb-6 flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        S
      </Link>
      <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="mb-6 text-center text-2xl font-semibold">Tạo tài khoản</h1>
        <RegisterForm />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
