import type { DecisionAnswers, DecisionPlugin, DecisionRecommendation, DecisionReport, DecisionRisk, DecisionScore, DecisionWorkflow } from "@datastorified/decision-os";

export type DecisionRepositoryDecision = {
  id: string;
  pluginId: string;
  workflowId: string;
  plugin: DecisionPlugin;
  workflow: DecisionWorkflow;
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
  updatedAt: string;
};

export type DecisionRepositoryInput = Omit<DecisionRepositoryDecision, "id" | "createdAt" | "updatedAt"> & Partial<Pick<DecisionRepositoryDecision, "id" | "createdAt" | "updatedAt">>;

export type DecisionRepositoryList = DecisionRepositoryDecision[];

export type DecisionRepositoryMode = "local" | "cloud";

export type DecisionRepositoryStatus = {
  mode: DecisionRepositoryMode;
};

export type DecisionRepositorySession = {
  authenticated: boolean;
};

export type DecisionRepositoryListResponse = {
  decisions: DecisionRepositoryDecision[];
};

export type DecisionRepositoryRecordResponse = {
  decision: DecisionRepositoryDecision;
};

export type DecisionRepositoryDeleteResponse = {
  deleted: boolean;
};

export type DecisionRepositorySaveOptions = {
  source?: DecisionRepositoryMode;
};

export type DecisionRepositoryHydration = {
  workflow?: DecisionWorkflow;
  report?: DecisionReport;
};
