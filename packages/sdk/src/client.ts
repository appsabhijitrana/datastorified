import type { DecisionProfile, DecisionProfileEnvelope, ProfileAnalysis as ProfileAnalysisModel } from "@datastorified/profile";
import { DataStorifiedError, HttpError, NetworkError, OfflineError, ParseError, UnauthorizedError } from "./errors";

export type DataStorifiedApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: DataStorifiedError; status?: number };

export type DataStorifiedClientOptions = {
  baseUrl?: string;
  fetcher?: typeof fetch;
};

export type DecisionScalar = string | number | boolean | null;
export type DecisionValue = DecisionScalar | DecisionScalar[];
export type DecisionAnswers = Record<string, DecisionValue | undefined>;

export type DecisionFactorScore = {
  factorId: string;
  label: string;
  score: number;
  weight: number;
  normalizedWeight: number;
  contribution: number;
};

export type DecisionScore = {
  value: number;
  max: 100;
  percentage: number;
  label?: string;
  factors: DecisionFactorScore[];
};

export type DecisionRiskSeverity = "low" | "medium" | "high" | "critical";

export type DecisionRisk = {
  id: string;
  title: string;
  description: string;
  severity: DecisionRiskSeverity;
  sourceRuleId?: string;
  mitigation?: string;
};

export type DecisionRecommendation = {
  id: string;
  minScore: number;
  maxScore: number;
  title: string;
  summary: string;
  actions: string[];
};

export type DecisionReport = {
  id: string;
  workflowId: string;
  pluginId: string;
  generatedAt: string;
  answers: DecisionAnswers;
  facts: Record<string, DecisionValue | undefined>;
  ruleEvaluations: Array<{ rule: { id: string; description: string }; matched: boolean }>;
  score: DecisionScore;
  risks: DecisionRisk[];
  recommendation?: DecisionRecommendation;
  actionPlan: string[];
};

export type DecisionWorkflowRef = {
  id: string;
  slug: string;
  pluginId: string;
  version: string;
  title: string;
  category?: string;
  description: string;
  assumptions?: string[];
  recommendations?: DecisionRecommendation[];
  actionPlanTemplates?: Array<{ id: string; minScore: number; maxScore: number; actions: string[] }>;
};

export type DecisionPluginRef = {
  id: string;
  name: string;
  version: string;
  categories: string[];
  keywords: string[];
  relatedCalculators: string[];
  relatedTools: string[];
  knowledgeAssumptions: Array<{ id: string; description: string }>;
  workflows?: DecisionWorkflowRef[];
};

export type DecisionRecord = {
  id: string;
  pluginId: string;
  workflowId: string;
  plugin: DecisionPluginRef;
  workflow: DecisionWorkflowRef;
  question: string;
  answers: DecisionAnswers;
  score: DecisionScore;
  confidence: number;
  riskLevel: DecisionRiskSeverity;
  recommendation: DecisionRecommendation;
  actionPlan: string[];
  assumptions: string[];
  report?: DecisionReport;
  createdAt: string;
  updatedAt: string;
};

export type ProfileAnalysis = ProfileAnalysisModel;

export type PersonalizationContext = {
  profile?: DecisionProfile | null;
  profileAnalysis?: ProfileAnalysis;
  recentDecisions?: Array<Pick<DecisionRecord, "id" | "workflowId" | "pluginId" | "answers" | "createdAt" | "updatedAt">>;
  savedDecisions?: Array<Pick<DecisionRecord, "id" | "workflowId" | "pluginId" | "answers" | "createdAt" | "updatedAt">>;
  history?: Array<Pick<DecisionRecord, "id" | "workflowId" | "pluginId" | "answers" | "createdAt" | "updatedAt">>;
  favoriteWorkflowIds?: string[];
  recentCalculators?: string[];
  favoriteCalculators?: string[];
};

export type PersonalizationSignal = {
  id: string;
  label: string;
  value: number;
  detail?: string;
};

export type PersonalizedWorkflowRecommendation = {
  workflow: DecisionWorkflowRef;
  score: number;
  reason: string;
  signals: PersonalizationSignal[];
};

export type PersonalizedActionRecommendation = {
  id: string;
  title: string;
  description: string;
  href?: string;
  type: "workflow" | "profile" | "calculator" | "decision";
};

export type PersonalizedRecommendationSet = {
  profileAnalysis: ProfileAnalysis;
  workflowRecommendations: PersonalizedWorkflowRecommendation[];
  profileRecommendations: PersonalizedActionRecommendation[];
  nextBestActions: PersonalizedActionRecommendation[];
  topWorkflow?: PersonalizedWorkflowRecommendation;
};

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
  riskLevel: DecisionRiskSeverity;
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

export type RecommendationResponse = PersonalizedRecommendationSet & { source: string };

function isNavigatorOffline(): boolean {
  return typeof navigator !== "undefined" && "onLine" in navigator && navigator.onLine === false;
}

function resolveUrl(baseUrl: string | undefined, path: string): string {
  if (!baseUrl) return path;
  return new URL(path, baseUrl).toString();
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function toError(error: unknown): DataStorifiedError {
  if (error instanceof DataStorifiedError) return error;
  if (error instanceof TypeError) return new NetworkError(error.message, error);
  if (error instanceof Error) return new DataStorifiedError("unknown", error.message, undefined, error);
  return new DataStorifiedError("unknown", "Unknown request error.", undefined, error);
}

async function safeRequest<T>(
  fetcher: typeof fetch,
  baseUrl: string | undefined,
  path: string,
  init?: RequestInit,
): Promise<DataStorifiedApiResult<T>> {
  if (isNavigatorOffline()) {
    return { ok: false, error: new OfflineError(), status: undefined };
  }

  try {
    const response = await fetcher(resolveUrl(baseUrl, path), {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      ...init,
    });
    if (response.status === 401) {
      return { ok: false, error: new UnauthorizedError(undefined, await parseResponseBody(response)), status: 401 };
    }
    if (!response.ok) {
      return { ok: false, error: new HttpError(response.status, `Request failed with status ${response.status}.`, await parseResponseBody(response)), status: response.status };
    }
    try {
      return { ok: true, data: (await response.json()) as T, status: response.status };
    } catch (error) {
      return { ok: false, error: new ParseError(undefined, error), status: response.status };
    }
  } catch (error) {
    const normalized = toError(error);
    return { ok: false, error: normalized, status: normalized.status };
  }
}

export function createDataStorifiedClient(options: DataStorifiedClientOptions = {}) {
  const fetcher = options.fetcher ?? fetch;
  const baseUrl = options.baseUrl;

  const profile = {
    async get(): Promise<DataStorifiedApiResult<DecisionProfileEnvelope>> {
      return safeRequest<DecisionProfileEnvelope>(fetcher, baseUrl, "/api/profile");
    },
    async update(profilePatch: Partial<DecisionProfile>): Promise<DataStorifiedApiResult<DecisionProfileEnvelope>> {
      return safeRequest<DecisionProfileEnvelope>(fetcher, baseUrl, "/api/profile", {
        method: "PATCH",
        body: JSON.stringify(profilePatch),
      });
    },
  };

  const decisions = {
    async list(): Promise<DataStorifiedApiResult<{ decisions: DecisionRecord[] }>> {
      return safeRequest<{ decisions: DecisionRecord[] }>(fetcher, baseUrl, "/api/decisions");
    },
    async get(id: string): Promise<DataStorifiedApiResult<{ decision: DecisionRecord }>> {
      return safeRequest<{ decision: DecisionRecord }>(fetcher, baseUrl, `/api/decisions/${encodeURIComponent(id)}`);
    },
    async save(decision: DecisionRecord): Promise<DataStorifiedApiResult<{ decision: DecisionRecord }>> {
      return safeRequest<{ decision: DecisionRecord }>(fetcher, baseUrl, "/api/decisions", {
        method: "POST",
        body: JSON.stringify(decision),
      });
    },
    async delete(id: string): Promise<DataStorifiedApiResult<{ deleted: boolean }>> {
      return safeRequest<{ deleted: boolean }>(fetcher, baseUrl, `/api/decisions/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  };

  const sync = {
    async push(payload: SyncPayload): Promise<DataStorifiedApiResult<{ summary: SyncSummary }>> {
      return safeRequest<{ summary: SyncSummary }>(fetcher, baseUrl, "/api/sync", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  };

  const recommendations = {
    async list(context: PersonalizationContext = {}): Promise<DataStorifiedApiResult<RecommendationResponse>> {
      const hasContext = Object.keys(context).length > 0;
      return safeRequest<RecommendationResponse>(
        fetcher,
        baseUrl,
        "/api/recommendations",
        hasContext
          ? {
              method: "POST",
              body: JSON.stringify(context),
            }
          : undefined,
      );
    },
  };

  return { profile, decisions, sync, recommendations };
}

export type DataStorifiedClient = ReturnType<typeof createDataStorifiedClient>;
