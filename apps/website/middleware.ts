import { NextRequest, NextResponse } from "next/server";
import { getDecisionBySlug, getDecisionRoute } from "@datastorified/decision-os";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const match = pathname.match(/^\/decision\/([^/]+)\/start$/u);
  if (!match) return NextResponse.next();
  const slug = decodeURIComponent(match[1]);
  const route = getDecisionRoute(getDecisionBySlug(slug)?.slug ?? slug);
  if (!route) return NextResponse.redirect(new URL("/decision", request.url));
  return NextResponse.redirect(new URL(route, request.url));
}

export const config = {
  matcher: ["/decision/:path*/start"],
};
