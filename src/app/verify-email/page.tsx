import Link from "next/link";
import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import { verifyEmailAction } from "@/lib/actions/verify-email-actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Xác nhận email" };

interface VerifyEmailPageProps {
  searchParams: Promise<{ email?: string; token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { email, token } = await searchParams;
  const result = email && token ? await verifyEmailAction(email, token) : { success: false as const };

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="mb-2 text-2xl font-semibold">
        {result.success ? "Xác nhận email thành công" : "Liên kết không hợp lệ"}
      </h1>
      <p className="mb-6 text-muted-foreground">
        {result.success
          ? "Email của bạn đã được xác nhận."
          : "Liên kết xác nhận không hợp lệ hoặc đã hết hạn."}
      </p>
      <Link href="/" className={cn(buttonVariants())}>
        Về trang chủ
      </Link>
    </div>
  );
}
