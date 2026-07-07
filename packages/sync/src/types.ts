import type { DecisionAnswers, DecisionRecommendation, DecisionReport, DecisionRisk, DecisionScore } from "@datastorified/decision-os";
import type { DecisionProfile, DecisionProfileEnvelope } from "@datastorified/profile";

export type SyncEntityBase = {
  localId: string;
  fingerprint: string;
  updatedAt: string;
};

export type SyncDecisionRecord = SyncEntityBase & {
  pluginId: string;
  workflowId: string;
  workflowSlug: string;
  title: string;
  question: string;
  answers: DecisionAnswers;
  score: DecisionScore;
  confidence: number;
  riskLevel: DecisionRisk["severity"];
  recommendation: DecisionRecommendation;
  actionPlan: string[];
  assumptions: string[];
  report?: DecisionReport;
  createdAt: string;
};

export type SyncFavoriteRecord = SyncEntityBase & {
  decisionLocalId: string;
  decisionFingerprint: string;
  label?: string;
};

export type SyncHistoryRecord = SyncEntityBase & {
  decisionLocalId: string;
  decisionFingerprint: string;
  title: string;
  summary?: string;
  score?: number;
  category?: string;
  openedAt: string;
};

export type SyncProfileRecord = SyncEntityBase & {
  profile: DecisionProfile;
  envelope?: DecisionProfileEnvelope;
};

export type SyncPayload = {
  decisions: SyncDecisionRecord[];
  favorites: SyncFavoriteRecord[];
  history: SyncHistoryRecord[];
  profile: SyncProfileRecord | null;
};

export type SyncSummary = {
  decisionsSynced: number;
  favoritesSynced: number;
  historySynced: number;
  profileUpdated: boolean;
  conflicts: number;
};

export type SyncResponse = {
  summary: SyncSummary;
};

export type LocalDecisionSyncSnapshot = {
  decisions: number;
  favorites: number;
  history: number;
  profile: boolean;
  hasPendingSync: boolean;
};
