import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@datastorified/auth";
import { prisma } from "@datastorified/database";
import { decisionProfileSchema, getProfileCompleteness, type DecisionProfile } from "@datastorified/profile";

type ProfileResponse = {
  profile: DecisionProfile | null;
  source: "authenticated" | "anonymous";
  completeness: number;
  updatedAt?: string;
};

function toNumber(value: { toString(): string } | number | null | undefined): number | undefined {
  if (value == null) return undefined;
  return typeof value === "number" ? value : Number(value.toString());
}

function toProfile(record: Awaited<ReturnType<typeof prisma.profile.findFirst>>): DecisionProfile | null {
  if (!record) return null;
  return {
    ageRange: record.ageRange as DecisionProfile["ageRange"],
    city: record.city ?? undefined,
    state: record.state ?? undefined,
    country: record.country ?? undefined,
    dependents: record.dependents ?? undefined,
    occupation: record.occupation ?? undefined,
    employmentType: record.employmentType as DecisionProfile["employmentType"],
    preferences: (record.preferences as DecisionProfile["preferences"]) ?? undefined,
    monthlyIncome: toNumber(record.monthlyIncome),
    monthlyExpenses: toNumber(record.monthlyExpenses),
    emergencyFund: toNumber(record.emergencyFund),
    assets: toNumber(record.assets),
    liabilities: toNumber(record.liabilities),
    activeLoans: record.activeLoans ?? undefined,
    monthlyEmis: toNumber(record.monthlyEmis),
    goals: (record.goals as DecisionProfile["goals"]) ?? undefined,
    riskProfile: record.riskProfile as DecisionProfile["riskProfile"],
    investmentExperience: record.investmentExperience as DecisionProfile["investmentExperience"],
    preferredCurrency: record.preferredCurrency ?? undefined,
    preferredLanguage: record.preferredLanguage ?? undefined,
    source: "cloud",
    updatedAt: record.updatedAt.toISOString(),
  };
}

function buildResponse(profile: DecisionProfile | null, source: ProfileResponse["source"], updatedAt?: string): ProfileResponse {
  return {
    profile,
    source,
    completeness: getProfileCompleteness(profile ?? undefined).score,
    updatedAt,
  };
}

export async function GET(request: NextRequest) {
  const session = await getAuthSession(request.headers);
  if (!session?.user?.id) {
    return NextResponse.json(buildResponse(null, "anonymous"));
  }

  const record = await prisma.profile.findUnique({ where: { userId: session.user.id } });
  const profile = toProfile(record);
  return NextResponse.json(buildResponse(profile, "authenticated", record?.updatedAt.toISOString()));
}

export async function PATCH(request: NextRequest) {
  const session = await getAuthSession(request.headers);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Anonymous users store profiles locally." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = decisionProfileSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile payload.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const current = await prisma.profile.findUnique({ where: { userId: session.user.id } });
  const currentProfile = toProfile(current) ?? {};
  const nextProfile = { ...currentProfile, ...parsed.data, source: "cloud" as const };

  const saved = await prisma.profile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      ageRange: nextProfile.ageRange ?? null,
      city: nextProfile.city ?? null,
      state: nextProfile.state ?? null,
      country: nextProfile.country ?? null,
      dependents: nextProfile.dependents ?? null,
      occupation: nextProfile.occupation ?? null,
      employmentType: nextProfile.employmentType ?? null,
      preferences: nextProfile.preferences ?? undefined,
      monthlyIncome: nextProfile.monthlyIncome ?? null,
      monthlyExpenses: nextProfile.monthlyExpenses ?? null,
      emergencyFund: nextProfile.emergencyFund ?? null,
      assets: nextProfile.assets ?? null,
      liabilities: nextProfile.liabilities ?? null,
      activeLoans: nextProfile.activeLoans ?? null,
      monthlyEmis: nextProfile.monthlyEmis ?? null,
      goals: nextProfile.goals ?? undefined,
      riskProfile: nextProfile.riskProfile ?? null,
      investmentExperience: nextProfile.investmentExperience ?? null,
      preferredCurrency: nextProfile.preferredCurrency ?? null,
      preferredLanguage: nextProfile.preferredLanguage ?? null,
      completenessScore: getProfileCompleteness(nextProfile).score,
      metadata: { source: "authenticated" },
    },
    update: {
      ageRange: nextProfile.ageRange ?? null,
      city: nextProfile.city ?? null,
      state: nextProfile.state ?? null,
      country: nextProfile.country ?? null,
      dependents: nextProfile.dependents ?? null,
      occupation: nextProfile.occupation ?? null,
      employmentType: nextProfile.employmentType ?? null,
      preferences: nextProfile.preferences ?? undefined,
      monthlyIncome: nextProfile.monthlyIncome ?? null,
      monthlyExpenses: nextProfile.monthlyExpenses ?? null,
      emergencyFund: nextProfile.emergencyFund ?? null,
      assets: nextProfile.assets ?? null,
      liabilities: nextProfile.liabilities ?? null,
      activeLoans: nextProfile.activeLoans ?? null,
      monthlyEmis: nextProfile.monthlyEmis ?? null,
      goals: nextProfile.goals ?? undefined,
      riskProfile: nextProfile.riskProfile ?? null,
      investmentExperience: nextProfile.investmentExperience ?? null,
      preferredCurrency: nextProfile.preferredCurrency ?? null,
      preferredLanguage: nextProfile.preferredLanguage ?? null,
      completenessScore: getProfileCompleteness(nextProfile).score,
      metadata: { source: "authenticated" },
    },
  });

  const profile = toProfile(saved);
  return NextResponse.json(buildResponse(profile, "authenticated", saved.updatedAt.toISOString()));
}
