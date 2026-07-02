import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@datastorified/auth/server";
import { prisma } from "@datastorified/database";
import { decisionPluginRegistry } from "@datastorified/decision-os";
import { getProfileCompleteness } from "@datastorified/profile";
import {
  mergeByFingerprintOrLocalId,
  resolveSyncConflict,
  type SyncDecisionRecord,
  type SyncFavoriteRecord,
  type SyncHistoryRecord,
  type SyncPayload,
  type SyncSummary,
} from "@datastorified/sync";

async function requireSession(request: NextRequest) {
  const session = await getAuthSession(request.headers);
  if (!session?.user?.id) return undefined;
  return session;
}

function toDate(value: string | Date | null | undefined): Date {
  if (!value) return new Date();
  return value instanceof Date ? value : new Date(value);
}

function buildDecisionWhere(userId: string, record: SyncDecisionRecord) {
  return {
    userId,
    OR: [
      { localId: record.localId },
      { fingerprint: record.fingerprint },
    ],
  };
}

function buildFavoriteWhere(userId: string, record: SyncFavoriteRecord) {
  return {
    userId,
    OR: [
      { localId: record.localId },
      { fingerprint: record.fingerprint },
      { decisionId: record.decisionLocalId },
    ],
  };
}

function buildHistoryWhere(userId: string, record: SyncHistoryRecord) {
  return {
    userId,
    OR: [
      { localId: record.localId },
      { fingerprint: record.fingerprint },
      { decisionId: record.decisionLocalId },
    ],
  };
}

function buildDecisionData(record: SyncDecisionRecord, userId: string, isFavorite: boolean) {
  const workflow = decisionPluginRegistry.getWorkflow(record.workflowId);
  const plugin = workflow ? decisionPluginRegistry.getPlugin(workflow.pluginId) : undefined;
  return {
    userId,
    localId: record.localId,
    fingerprint: record.fingerprint,
    pluginId: record.pluginId,
    pluginName: plugin?.name ?? workflow?.pluginId ?? record.pluginId,
    workflowId: record.workflowId,
    workflowSlug: record.workflowSlug,
    workflowVersion: workflow?.version ?? "0",
    title: record.title,
    category: workflow?.category ?? null,
    question: record.question,
    answers: record.answers as object,
    score: record.score as object,
    confidence: record.confidence,
    riskLevel: record.riskLevel,
    recommendation: record.recommendation as object,
    actionPlan: record.actionPlan as object,
    assumptions: record.assumptions as object,
    reportVersion: record.report?.id ?? null,
    source: "cloud",
    status: "saved",
    isFavorite,
    sourceUpdatedAt: toDate(record.updatedAt),
    updatedAt: toDate(record.updatedAt),
    createdAt: toDate(record.createdAt),
  };
}

function isNewer(localUpdatedAt: string, cloudUpdatedAt: Date | null | undefined): boolean {
  if (!cloudUpdatedAt) return true;
  return Date.parse(localUpdatedAt) >= cloudUpdatedAt.getTime();
}

function buildSyncSummary(summary: Partial<SyncSummary>): SyncSummary {
  return {
    decisionsSynced: summary.decisionsSynced ?? 0,
    favoritesSynced: summary.favoritesSynced ?? 0,
    historySynced: summary.historySynced ?? 0,
    profileUpdated: summary.profileUpdated ?? false,
    conflicts: summary.conflicts ?? 0,
  };
}

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!session) {
    return NextResponse.json({ error: "Please sign in to sync decisions." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Partial<SyncPayload>;
  const decisions = mergeByFingerprintOrLocalId(body.decisions ?? [], []);
  const favorites = mergeByFingerprintOrLocalId(body.favorites ?? [], []);
  const history = mergeByFingerprintOrLocalId(body.history ?? [], []);
  const favoriteKeys = new Set([
    ...favorites.map((item) => item.decisionLocalId),
    ...favorites.map((item) => item.decisionFingerprint),
  ]);

  const summary: SyncSummary = {
    decisionsSynced: 0,
    favoritesSynced: 0,
    historySynced: 0,
    profileUpdated: false,
    conflicts: 0,
  };

  const decisionIdMap = new Map<string, string>();

  for (const record of decisions) {
    const existing = await prisma.decision.findFirst({ where: buildDecisionWhere(session.user.id, record) });
    const resolved = existing
      ? resolveSyncConflict(record, {
          ...record,
          updatedAt: existing.sourceUpdatedAt?.toISOString() ?? existing.updatedAt.toISOString(),
        })
      : undefined;
    if (existing && resolved?.reason === "cloud-newer") {
      summary.conflicts += 1;
      decisionIdMap.set(record.localId, existing.id);
      decisionIdMap.set(record.fingerprint, existing.id);
      continue;
    }

    const isFavorite = favoriteKeys.has(record.localId) || favoriteKeys.has(record.fingerprint);
    const data = buildDecisionData(record, session.user.id, isFavorite);
    const saved = existing
      ? await prisma.decision.update({ where: { id: existing.id }, data })
      : await prisma.decision.create({ data });

    decisionIdMap.set(record.localId, saved.id);
    decisionIdMap.set(record.fingerprint, saved.id);
    summary.decisionsSynced += 1;
  }

  for (const record of favorites) {
    const decisionId = decisionIdMap.get(record.decisionLocalId) ?? decisionIdMap.get(record.decisionFingerprint);
    if (!decisionId) {
      summary.conflicts += 1;
      continue;
    }
    const existing = await prisma.favorite.findFirst({ where: buildFavoriteWhere(session.user.id, record) });
    const data = {
      userId: session.user.id,
      localId: record.localId,
      fingerprint: record.fingerprint,
      decisionId,
      label: record.label ?? null,
      sourceUpdatedAt: toDate(record.updatedAt),
      updatedAt: toDate(record.updatedAt),
      createdAt: existing?.createdAt ?? toDate(record.updatedAt),
    };
    if (existing && !isNewer(record.updatedAt, existing.sourceUpdatedAt ?? existing.updatedAt)) {
      summary.conflicts += 1;
      continue;
    }
    if (existing) {
      await prisma.favorite.update({ where: { id: existing.id }, data });
    } else {
      await prisma.favorite.create({ data });
    }
    summary.favoritesSynced += 1;
  }

  for (const record of history) {
    const decisionId = decisionIdMap.get(record.decisionLocalId) ?? decisionIdMap.get(record.decisionFingerprint);
    if (!decisionId) {
      summary.conflicts += 1;
      continue;
    }
    const existing = await prisma.historyItem.findFirst({ where: buildHistoryWhere(session.user.id, record) });
    const data = {
      userId: session.user.id,
      localId: record.localId,
      fingerprint: record.fingerprint,
      decisionId,
      title: record.title,
      summary: record.summary ?? null,
      score: typeof record.score === "number" ? Math.round(record.score) : null,
      category: record.category ?? null,
      openedAt: toDate(record.openedAt),
      sourceUpdatedAt: toDate(record.updatedAt),
      updatedAt: toDate(record.updatedAt),
      createdAt: existing?.createdAt ?? toDate(record.updatedAt),
    };
    if (existing && !isNewer(record.updatedAt, existing.sourceUpdatedAt ?? existing.updatedAt)) {
      summary.conflicts += 1;
      continue;
    }
    if (existing) {
      await prisma.historyItem.update({ where: { id: existing.id }, data });
    } else {
      await prisma.historyItem.create({ data });
    }
    summary.historySynced += 1;
  }

  if (body.profile?.profile) {
    const existingProfile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
    const localUpdatedAt = body.profile.updatedAt ?? body.profile.profile.updatedAt ?? new Date().toISOString();
    const cloudUpdatedAt = existingProfile?.sourceUpdatedAt ?? existingProfile?.updatedAt ?? new Date(0);
    if (!existingProfile || isNewer(localUpdatedAt, cloudUpdatedAt)) {
      const profile = body.profile.profile;
      await prisma.profile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          sourceUpdatedAt: toDate(localUpdatedAt),
          ageRange: profile.ageRange ?? null,
          city: profile.city ?? null,
          state: profile.state ?? null,
          country: profile.country ?? null,
          dependents: profile.dependents ?? null,
          occupation: profile.occupation ?? null,
          employmentType: profile.employmentType ?? null,
          preferences: profile.preferences ?? undefined,
          monthlyIncome: profile.monthlyIncome ?? null,
          monthlyExpenses: profile.monthlyExpenses ?? null,
          emergencyFund: profile.emergencyFund ?? null,
          assets: profile.assets ?? null,
          liabilities: profile.liabilities ?? null,
          activeLoans: profile.activeLoans ?? null,
          monthlyEmis: profile.monthlyEmis ?? null,
          goals: profile.goals ?? undefined,
          riskProfile: profile.riskProfile ?? null,
          investmentExperience: profile.investmentExperience ?? null,
          preferredCurrency: profile.preferredCurrency ?? null,
          preferredLanguage: profile.preferredLanguage ?? null,
          completenessScore: getProfileCompleteness(profile).score,
          metadata: { source: "sync" },
        },
        update: {
          sourceUpdatedAt: toDate(localUpdatedAt),
          ageRange: profile.ageRange ?? null,
          city: profile.city ?? null,
          state: profile.state ?? null,
          country: profile.country ?? null,
          dependents: profile.dependents ?? null,
          occupation: profile.occupation ?? null,
          employmentType: profile.employmentType ?? null,
          preferences: profile.preferences ?? undefined,
          monthlyIncome: profile.monthlyIncome ?? null,
          monthlyExpenses: profile.monthlyExpenses ?? null,
          emergencyFund: profile.emergencyFund ?? null,
          assets: profile.assets ?? null,
          liabilities: profile.liabilities ?? null,
          activeLoans: profile.activeLoans ?? null,
          monthlyEmis: profile.monthlyEmis ?? null,
          goals: profile.goals ?? undefined,
          riskProfile: profile.riskProfile ?? null,
          investmentExperience: profile.investmentExperience ?? null,
          preferredCurrency: profile.preferredCurrency ?? null,
          preferredLanguage: profile.preferredLanguage ?? null,
          completenessScore: getProfileCompleteness(profile).score,
          metadata: { source: "sync" },
        },
      });
      summary.profileUpdated = true;
    } else {
      summary.conflicts += 1;
    }
  }

  return NextResponse.json({ summary: buildSyncSummary(summary) });
}
