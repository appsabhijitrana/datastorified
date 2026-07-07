import { NextResponse, type NextRequest } from "next/server";
import { getAuthSession } from "@datastorified/auth/server";
import { prisma } from "@datastorified/database";
import { buildLegalAcceptanceStatus, CURRENT_LEGAL_VERSIONS, requiresLegalAcceptance } from "@datastorified/legal";

export async function GET(request: NextRequest) {
  const session = await getAuthSession(request.headers);
  if (!session?.user?.id) {
    return NextResponse.json({
      ...buildLegalAcceptanceStatus(null),
      requiresAcceptance: false,
      currentVersions: CURRENT_LEGAL_VERSIONS,
    });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const status = buildLegalAcceptanceStatus(user);
  return NextResponse.json({
    ...status,
    requiresAcceptance: requiresLegalAcceptance(user),
  });
}

