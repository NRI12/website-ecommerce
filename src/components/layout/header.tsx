import Link from "next/link";
import { Store, User } from "lucide-react";
import { auth, signOut } from "@/auth";
import { buttonVariants, Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCartWithItems } from "@/lib/cart";
import { SearchBar } from "@/components/layout/search-bar";
import { MiniCart } from "@/components/cart/mini-cart";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export async function Header() {
  const [session, cart] = await Promise.all([auth(), getCartWithItems()]);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">
            S
          </span>
          <span className="hidden sm:inline">Shop</span>
        </Link>

        <div className="hidden flex-1 md:block">
          <SearchBar />
        </div>

        <nav className="ml-auto flex items-center gap-1">
          {session?.user?.role === "VENDOR" || session?.user?.role === "ADMIN" ? (
            <Link
              href={session.user.role === "ADMIN" ? "/admin" : "/vendor"}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              <Store className="size-4" />
              <span className="hidden sm:inline">Kênh bán hàng</span>
            </Link>
          ) : null}

          <ThemeToggle />

          <MiniCart items={cart?.items ?? []} subtotal={cart?.subtotal ?? 0} itemCount={cart?.itemCount ?? 0} />

          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" aria-label="Tài khoản">
                    <User className="size-5" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem render={<Link href="/account/orders" />}>
                  Đơn hàng của tôi
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/account/wishlist" />}>
                  Yêu thích
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/account/profile" />}>
                  Hồ sơ
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={
                    <form
                      action={async () => {
                        "use server";
                        await signOut({ redirectTo: "/" });
                      }}
                    >
                      <button type="submit" className="w-full text-left">
                        Đăng xuất
                      </button>
                    </form>
                  }
                />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login" className={cn(buttonVariants({ size: "sm" }))}>
              Đăng nhập
            </Link>
          )}
        </nav>
      </div>
      <div className="border-t px-4 py-2 md:hidden">
        <SearchBar />
      </div>
    </header>
  );
}
