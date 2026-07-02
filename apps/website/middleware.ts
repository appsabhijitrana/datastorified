import { NextResponse, type NextRequest } from "next/server";
import { StatusService } from "./lib/status/service";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.startsWith("/favicon") || pathname.startsWith("/brand") || pathname.startsWith("/manifest") || pathname.startsWith("/robots") || pathname.startsWith("/sitemap") || pathname === "/maintenance" || pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.next();
  }

  if (!StatusService.shouldBlockPublicPath(pathname)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/maintenance";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
