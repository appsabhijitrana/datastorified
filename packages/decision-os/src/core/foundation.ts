import type {
  DecisionAnswer,
  DecisionAnswers,
  DecisionQuestionType,
  DecisionReport,
  DecisionRecommendation,
  DecisionRisk,
  DecisionScore,
  DecisionValue,
} from "../types";

export type QuestionType = DecisionQuestionType;

export interface DecisionOption<TValue = DecisionValue> {
  id?: string;
  label: string;
  value: TValue;
  description?: string;
  helperText?: string;
  disabled?: boolean;
  metadata?: Record<string, unknown>;
}

export type QuestionAnswer = DecisionAnswer;

export interface DecisionSession {
  id: string;
  workflowId: string;
  pluginId: string;
  status: "draft" | "in_progress" | "completed" | "archived";
  currentQuestionId?: string;
  answers: DecisionAnswers;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface DecisionDraft {
  id?: string;
  sessionId?: string;
  workflowId: string;
  pluginId: string;
  answers: DecisionAnswers;
  currentQuestionId?: string;
  progress?: number;
  createdAt?: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface ScoreFactor {
  id: string;
  label: string;
  weight: number;
  direction?: "positive" | "negative" | "neutral";
  questionId?: string;
  description?: string;
  maxContribution?: number;
  minContribution?: number;
}

export interface ScoringModel {
  id: string;
  label: string;
  description?: string;
  maxScore?: number;
  factors: ScoreFactor[];
}

export interface RiskFactor {
  id: string;
  label: string;
  weight: number;
  severity?: "low" | "medium" | "high" | "critical";
  questionId?: string;
  description?: string;
  threshold?: number;
}

export interface RiskModel {
  id: string;
  label: string;
  description?: string;
  maxRisk?: number;
  factors: RiskFactor[];
}

export interface ActionPlan {
  id?: string;
  title?: string;
  summary?: string;
  steps: string[];
  warnings?: string[];
  nextChecks?: string[];
  metadata?: Record<string, unknown>;
}

export interface RecommendationResult {
  id?: string;
  title: string;
  summary: string;
  actions: string[];
  confidence?: number;
  scoreRange?: [number, number];
  rationale?: string;
  metadata?: Record<string, unknown>;
}

export interface SimulationInput {
  workflowId: string;
  pluginId?: string;
  answers?: DecisionAnswers;
  overrides?: DecisionAnswers;
  scenarioId?: string;
  variables?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface SimulationResult {
  input: SimulationInput;
  score: DecisionScore;
  risk: DecisionRisk;
  recommendation?: DecisionRecommendation | RecommendationResult;
  actionPlan: ActionPlan;
  delta?: {
    score?: number;
    risk?: number;
  };
  report?: DecisionReport;
  metadata?: Record<string, unknown>;
}

export interface DecisionResult {
  id: string;
  workflowId: string;
  pluginId: string;
  sessionId?: string;
  draftId?: string;
  answers: DecisionAnswers;
  score: DecisionScore;
  risk: DecisionRisk;
  recommendation?: DecisionRecommendation | RecommendationResult;
  actionPlan: ActionPlan;
  simulation?: SimulationResult;
  report?: DecisionReport;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface DecisionRepository<
  TDecision extends DecisionResult = DecisionResult,
  TDraft extends DecisionDraft = DecisionDraft,
  TSession extends DecisionSession = DecisionSession,
> {
  saveDecision(decision: TDecision): Promise<TDecision>;
  getDecision(id: string): Promise<TDecision | null>;
  listDecisions(filter?: { workflowId?: string; pluginId?: string; limit?: number }): Promise<TDecision[]>;
  deleteDecision(id: string): Promise<void>;
  saveDraft(draft: TDraft): Promise<TDraft>;
  getDraft(workflowId: string): Promise<TDraft | null>;
  listDrafts(): Promise<TDraft[]>;
  saveSession(session: TSession): Promise<TSession>;
  getSession(id: string): Promise<TSession | null>;
}
