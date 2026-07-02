import { NextResponse, type NextRequest } from "next/server";
import { StatusService } from "./lib/status/service";

const ALLOWED_PATHS = new Set(["/maintenance", "/status", "/api/health"]);

export function middleware(request: NextRequest) {
  const maintenance = StatusService.getMaintenance();
  if (!maintenance.enabled) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/brand") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/sitemap") ||
    ALLOWED_PATHS.has(pathname)
  ) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/maintenance";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};

