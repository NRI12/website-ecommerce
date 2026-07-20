import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-2 text-2xl font-semibold">Không tìm thấy trang</h1>
      <p className="mt-2 text-muted-foreground">
        Trang bạn tìm không tồn tại hoặc đã bị di chuyển.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className={cn(buttonVariants())}>
          Về trang chủ
        </Link>
        <Link href="/products" className={cn(buttonVariants({ variant: "outline" }))}>
          Xem sản phẩm
        </Link>
      </div>
    </div>
  );
}
