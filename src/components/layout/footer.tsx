import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 text-sm sm:grid-cols-5">
        <div className="col-span-2 sm:col-span-1">
          <Link href="/" className="mb-3 flex items-center gap-2 text-base font-bold tracking-tight">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-xs text-primary-foreground">
              S
            </span>
            Shop
          </Link>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Nền tảng thương mại điện tử đa gian hàng, kết nối người bán uy tín với hàng triệu khách hàng.
          </p>
        </div>
        <div>
          <h3 className="mb-3 font-semibold">Về chúng tôi</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link href="/about" className="hover:text-foreground">Giới thiệu</Link></li>
            <li><Link href="/vendor/register" className="hover:text-foreground">Bán hàng cùng chúng tôi</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-semibold">Hỗ trợ khách hàng</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link href="/account/orders" className="hover:text-foreground">Tra cứu đơn hàng</Link></li>
            <li><Link href="/policies/shipping" className="hover:text-foreground">Chính sách giao hàng</Link></li>
            <li><Link href="/policies/returns" className="hover:text-foreground">Đổi trả</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-semibold">Thanh toán</h3>
          <p className="text-muted-foreground">Stripe · COD</p>
          <h3 className="mt-4 mb-3 font-semibold">Liên hệ</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link href="/contact" className="hover:text-foreground">support@example.com</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Shop. All rights reserved.
      </div>
    </footer>
  );
}
