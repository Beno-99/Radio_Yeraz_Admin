import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;

  if (pathname === "/") {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (pathname === "/dashboard/ads" || pathname.startsWith("/dashboard/ads/")) {
    url.pathname = pathname.replace("/dashboard/ads", "/dashboard/carousels");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/ads/:path*"],
};
