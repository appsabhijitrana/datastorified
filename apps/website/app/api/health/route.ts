import { NextResponse } from "next/server";
import { StatusService } from "../../../lib/status/service";

export function GET() {
  return NextResponse.json(StatusService.getHealth(), { headers: { "cache-control": "no-store" } });
}
