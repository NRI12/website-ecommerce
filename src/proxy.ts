import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (pathname.startsWith("/vendor/register")) {
    if (!req.auth) {
      const loginUrl = new URL("/login", req.nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  } else if (pathname.startsWith("/vendor") && role !== "VENDOR" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if ((pathname.startsWith("/account") || pathname.startsWith("/checkout")) && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/admin/:path*", "/vendor/:path*", "/account/:path*", "/checkout/:path*"],
};
