import { NextRequest, NextResponse } from "next/server";

function isAdminPath(pathname: string) {
  return pathname.startsWith("/admin");
}

function shouldBlock() {
  const maintenanceEnabled = process.env.NEXT_PUBLIC_MAINTENANCE_ENABLED === "true";
  const maintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "page";
  const outageEnabled = process.env.NEXT_PUBLIC_OUTAGE_ENABLED === "true";
  return (maintenanceEnabled && maintenanceMode) || outageEnabled;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!shouldBlock() || isAdminPath(pathname)) {
    return NextResponse.next();
  }
  const url = request.nextUrl.clone();
  url.pathname = "/maintenance";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/:path*"],
};
