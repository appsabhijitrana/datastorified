import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@datastorified/auth";
import { prisma } from "@datastorified/database";
import type { DecisionAnswers } from "@datastorified/decision-os";
import { buildPersonalizedRecommendations, type PersonalizationContext } from "@datastorified/personalization";
import { getProfileAnalysis, type DecisionProfile } from "@datastorified/profile";

function parseContext(request: NextRequest): PersonalizationContext {
  const raw = request.nextUrl.searchParams.get("context");
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as PersonalizationContext;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function toProfile(record: Awaited<ReturnType<typeof prisma.profile.findFirst>>): DecisionProfile | undefined {
  if (!record) return undefined;
  return {
    ageRange: record.ageRange as DecisionProfile["ageRange"],
    city: record.city ?? undefined,
    state: record.state ?? undefined,
    country: record.country ?? undefined,
    dependents: record.dependents ?? undefined,
    occupation: record.occupation ?? undefined,
    employmentType: record.employmentType as DecisionProfile["employmentType"],
    preferences: (record.preferences as DecisionProfile["preferences"]) ?? undefined,
    monthlyIncome: record.monthlyIncome == null ? undefined : Number(record.monthlyIncome),
    monthlyExpenses: record.monthlyExpenses == null ? undefined : Number(record.monthlyExpenses),
    emergencyFund: record.emergencyFund == null ? undefined : Number(record.emergencyFund),
    assets: record.assets == null ? undefined : Number(record.assets),
    liabilities: record.liabilities == null ? undefined : Number(record.liabilities),
    activeLoans: record.activeLoans ?? undefined,
    monthlyEmis: record.monthlyEmis == null ? undefined : Number(record.monthlyEmis),
    goals: (record.goals as DecisionProfile["goals"]) ?? undefined,
    riskProfile: record.riskProfile as DecisionProfile["riskProfile"],
    investmentExperience: record.investmentExperience as DecisionProfile["investmentExperience"],
    preferredCurrency: record.preferredCurrency ?? undefined,
    preferredLanguage: record.preferredLanguage ?? undefined,
    source: "cloud",
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toStoredDecision(row: { id: string; workflowId: string; pluginId: string; answers: unknown; createdAt: Date; updatedAt: Date }) {
  return {
    id: row.id,
    workflowId: row.workflowId,
    pluginId: row.pluginId,
    answers: row.answers as DecisionAnswers,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const session = await getAuthSession(request.headers).catch(() => null);
  const queryContext = parseContext(request);

  if (session?.user?.id) {
    const [profileRecord, recentDecisions, savedDecisions, historyItems] = await Promise.all([
      prisma.profile.findUnique({ where: { userId: session.user.id } }),
      prisma.decision.findMany({ where: { userId: session.user.id }, orderBy: { updatedAt: "desc" }, take: 10 }),
      prisma.decision.findMany({ where: { userId: session.user.id, status: "saved" }, orderBy: { updatedAt: "desc" }, take: 10 }),
      prisma.historyItem.findMany({ where: { userId: session.user.id }, include: { decision: true }, orderBy: { openedAt: "desc" }, take: 10 }),
    ]);

    const recommendations = buildPersonalizedRecommendations({
      ...queryContext,
      profile: queryContext.profile ?? toProfile(profileRecord),
      recentDecisions: queryContext.recentDecisions ?? recentDecisions.map(toStoredDecision),
      savedDecisions: queryContext.savedDecisions ?? savedDecisions.map(toStoredDecision),
      favoriteWorkflowIds: queryContext.favoriteWorkflowIds ?? savedDecisions.map((row) => row.workflowId),
      history: queryContext.history ?? historyItems.map((row) => ({ id: row.id, workflowId: row.decision.workflowId, pluginId: row.decision.pluginId, answers: row.decision.answers as DecisionAnswers, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() })),
      profileAnalysis: profileRecord ? getProfileAnalysis(toProfile(profileRecord)) : undefined,
    });
    return NextResponse.json({ source: "cloud", ...recommendations });
  }

  const recommendations = buildPersonalizedRecommendations(queryContext);
  return NextResponse.json({ source: "context", ...recommendations });
}
