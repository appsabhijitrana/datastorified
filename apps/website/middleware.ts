import { NextRequest, NextResponse } from "next/server";
import { decisionPluginRegistry } from "@datastorified/decision-os";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const match = pathname.match(/^\/decision\/([^/]+)\/start$/u);
  if (!match) return NextResponse.next();
  const slug = decodeURIComponent(match[1]);
  const workflow = decisionPluginRegistry.getWorkflowBySlug(slug);
  if (!workflow) return NextResponse.redirect(new URL("/decision", request.url));
  return NextResponse.redirect(new URL(`/decision/${workflow.pluginId}/${workflow.slug}`, request.url));
}

export const config = {
  matcher: ["/decision/:path*/start"],
};
