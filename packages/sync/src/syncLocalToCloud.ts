import { decisionPluginRegistry, type StoredDecision } from "@datastorified/decision-os";
import { localDecisionStorage } from "@datastorified/decision-os";
import { localProfileStorage, type DecisionProfileEnvelope } from "@datastorified/profile";
import { createDataStorifiedClient } from "@datastorified/sdk";
import { createFingerprint, mergeByFingerprintOrLocalId } from "./merge";
import type {
  LocalDecisionSyncSnapshot,
  SyncDecisionRecord,
  SyncFavoriteRecord,
  SyncHistoryRecord,
  SyncPayload,
  SyncResponse,
  SyncSummary,
} from "./types";

type SyncOptions = {
  baseUrl?: string;
  fetcher?: typeof fetch;
};

function buildDecisionFingerprint(decision: Pick<StoredDecision, "pluginId" | "workflowId" | "answers">): string {
  return createFingerprint({
    type: "decision",
    pluginId: decision.pluginId,
    workflowId: decision.workflowId,
    answers: decision.answers,
  });
}

function decisionToRecord(decision: StoredDecision): SyncDecisionRecord | undefined {
  const workflow = decisionPluginRegistry.getWorkflow(decision.workflowId);
  const plugin = workflow ? decisionPluginRegistry.getPlugin(workflow.pluginId) : undefined;
  if (!workflow || !plugin) return undefined;
  const report = decision.report;
  const score = report?.score ?? { value: 0, max: 100 as const, percentage: 0, factors: [] };
  return {
    localId: decision.id,
    fingerprint: buildDecisionFingerprint(decision),
    pluginId: decision.pluginId,
    workflowId: decision.workflowId,
    workflowSlug: workflow.slug,
    title: workflow.title,
    question: workflow.title,
    answers: decision.answers,
    score,
    confidence: report ? Math.round(report.score.percentage) : Math.round(score.percentage),
    riskLevel: report?.risks?.[0]?.severity ?? "low",
    recommendation: report?.recommendation ?? workflow.recommendations[0] ?? {
      id: `${workflow.id}:default`,
      minScore: 0,
      maxScore: 100,
      title: workflow.title,
      summary: workflow.description,
      actions: workflow.assumptions?.slice(0, 3) ?? [],
    },
    actionPlan: report?.actionPlan ?? workflow.actionPlanTemplates?.[0]?.actions ?? workflow.assumptions?.slice(0, 3) ?? [],
    assumptions: decision.report?.facts ? workflow.assumptions ?? [] : workflow.assumptions ?? [],
    report,
    createdAt: decision.createdAt,
    updatedAt: decision.updatedAt,
  };
}

function decisionToFavoriteRecord(decision: StoredDecision): SyncFavoriteRecord | undefined {
  const workflow = decisionPluginRegistry.getWorkflow(decision.workflowId);
  if (!workflow) return undefined;
  const fingerprint = buildDecisionFingerprint(decision);
  return {
    localId: `favorite:${decision.id}`,
    fingerprint: createFingerprint({ type: "favorite", fingerprint, workflowId: workflow.id }),
    decisionLocalId: decision.id,
    decisionFingerprint: fingerprint,
    label: workflow.title,
    updatedAt: decision.updatedAt,
  };
}

function decisionToHistoryRecord(decision: StoredDecision): SyncHistoryRecord | undefined {
  const workflow = decisionPluginRegistry.getWorkflow(decision.workflowId);
  if (!workflow) return undefined;
  const fingerprint = buildDecisionFingerprint(decision);
  return {
    localId: `history:${decision.id}`,
    fingerprint: createFingerprint({ type: "history", fingerprint, workflowId: workflow.id }),
    decisionLocalId: decision.id,
    decisionFingerprint: fingerprint,
    title: workflow.title,
    summary: workflow.description,
    score: decision.report?.score?.percentage,
    category: workflow.category,
    openedAt: decision.updatedAt,
    updatedAt: decision.updatedAt,
  };
}

function profileToRecord(envelope: DecisionProfileEnvelope): SyncPayload["profile"] {
  const profile = envelope.profile;
  if (!profile) return null;
  return {
    localId: "profile",
    fingerprint: createFingerprint({ type: "profile", profile, lastOpenedWorkflow: envelope.lastOpenedWorkflow }),
    profile,
    envelope,
    updatedAt: envelope.updatedAt ?? profile.updatedAt ?? new Date().toISOString(),
  };
}

export function getLocalDecisionSyncSnapshot(): LocalDecisionSyncSnapshot {
  const decisions = localDecisionStorage.listSaved().length + localDecisionStorage.listHistory().length;
  const favorites = localDecisionStorage.listSaved().length;
  const history = localDecisionStorage.listHistory().length;
  const profile = Boolean(localProfileStorage.getProfile().profile || localProfileStorage.getProfile().lastOpenedWorkflow);
  return {
    decisions,
    favorites,
    history,
    profile,
    hasPendingSync: decisions > 0 || favorites > 0 || history > 0 || profile,
  };
}

export function collectLocalSyncPayload(): SyncPayload {
  const saved = localDecisionStorage.listSaved();
  const history = localDecisionStorage.listHistory();
  const profileEnvelope = localProfileStorage.getProfile();
  const decisionRecords = [...saved, ...history]
    .map(decisionToRecord)
    .filter((item): item is SyncDecisionRecord => Boolean(item));
  const decisions = mergeByFingerprintOrLocalId(decisionRecords, []);
  const favorites = mergeByFingerprintOrLocalId(
    saved.map(decisionToFavoriteRecord).filter((item): item is SyncFavoriteRecord => Boolean(item)),
    [],
  );
  const historyRecords = mergeByFingerprintOrLocalId(
    history.map(decisionToHistoryRecord).filter((item): item is SyncHistoryRecord => Boolean(item)),
    [],
  );

  return {
    decisions,
    favorites,
    history: historyRecords,
    profile: profileToRecord(profileEnvelope),
  };
}

function buildSummary(payload: SyncPayload): SyncSummary {
  return {
    decisionsSynced: payload.decisions.length,
    favoritesSynced: payload.favorites.length,
    historySynced: payload.history.length,
    profileUpdated: Boolean(payload.profile),
    conflicts: 0,
  };
}

export async function syncLocalToCloud(options: SyncOptions = {}): Promise<SyncSummary> {
  const payload = collectLocalSyncPayload();
  const client = createDataStorifiedClient({ baseUrl: options.baseUrl, fetcher: options.fetcher });
  const result = await client.sync.push(payload);
  if (!result.ok) return buildSummary(payload);
  return result.data.summary ?? buildSummary(payload);
}
