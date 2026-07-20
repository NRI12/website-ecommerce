import Link from "next/link";
import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Đặt lại mật khẩu" };

interface ResetPasswordPageProps {
  searchParams: Promise<{ email?: string; token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { email, token } = await searchParams;

  if (!email || !token) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="mb-6 text-muted-foreground">Liên kết đặt lại mật khẩu không hợp lệ.</p>
        <Link href="/forgot-password" className={cn(buttonVariants())}>
          Yêu cầu liên kết mới
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-6 text-center text-2xl font-semibold">Đặt lại mật khẩu</h1>
      <ResetPasswordForm email={email} token={token} />
    </div>
  );
}
