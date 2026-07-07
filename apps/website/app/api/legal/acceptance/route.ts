import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@datastorified/auth/server";
import { prisma } from "@datastorified/database";
import { buildLegalAcceptanceStatus, CURRENT_LEGAL_VERSIONS, requiresLegalAcceptance } from "@datastorified/legal";

const acceptanceSchema = z.object({
  termsVersion: z.string().min(1),
  privacyVersion: z.string().min(1),
  legalAcceptanceVersion: z.string().min(1),
  acceptedAt: z.string().datetime(),
});

export async function POST(request: NextRequest) {
  const session = await getAuthSession(request.headers);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const parsed = acceptanceSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid legal acceptance payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  if (
    parsed.data.termsVersion !== CURRENT_LEGAL_VERSIONS.termsVersion ||
    parsed.data.privacyVersion !== CURRENT_LEGAL_VERSIONS.privacyVersion ||
    parsed.data.legalAcceptanceVersion !== CURRENT_LEGAL_VERSIONS.legalAcceptanceVersion
  ) {
    return NextResponse.json({ error: "Outdated legal versions." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      termsAcceptedAt: new Date(parsed.data.acceptedAt),
      termsVersion: parsed.data.termsVersion,
      privacyAcceptedAt: new Date(parsed.data.acceptedAt),
      privacyVersion: parsed.data.privacyVersion,
      legalAcceptedAt: new Date(parsed.data.acceptedAt),
      legalAcceptanceVersion: parsed.data.legalAcceptanceVersion,
    },
  });

  void updated;

  return NextResponse.json({
    success: true,
    status: buildLegalAcceptanceStatus(updated),
    requiresLegalAcceptance: requiresLegalAcceptance(updated),
  });
}

