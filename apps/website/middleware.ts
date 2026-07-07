import { NextRequest, NextResponse } from "next/server";

export function middleware(_request: NextRequest) {
  void _request;
  return NextResponse.next();
}

export const config = {
  matcher: ["/decision/:path*/start"],
};
