import { decisionPluginRegistry, type DecisionPlugin, type DecisionRecommendation, type DecisionReport, type DecisionRisk, type DecisionWorkflow } from "@datastorified/decision-os";
import type { DecisionRepositoryDecision, DecisionRepositoryInput } from "./types";

const riskSeverityRank: Record<DecisionRisk["severity"], number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

function nowIso() {
  return new Date().toISOString();
}

function defaultRecommendation(workflow: DecisionWorkflow): DecisionRecommendation {
  return workflow.recommendations[0] ?? {
    id: `${workflow.id}:default`,
    minScore: 0,
    maxScore: 100,
    title: workflow.title,
    summary: workflow.description,
    actions: workflow.assumptions?.slice(0, 3) ?? ["Review assumptions"],
  };
}

function deriveRiskLevel(report?: DecisionReport): DecisionRisk["severity"] {
  if (!report?.risks?.length) return "low";
  return report.risks.reduce((current, risk) => (riskSeverityRank[risk.severity] > riskSeverityRank[current] ? risk.severity : current), "low" as DecisionRisk["severity"]);
}

function deriveConfidence(report?: DecisionReport): number {
  if (!report) return 0;
  return Math.max(0, Math.min(100, Math.round(report.score.percentage)));
}

function deriveActionPlan(report?: DecisionReport, recommendation?: DecisionRecommendation): string[] {
  if (report?.actionPlan?.length) return [...report.actionPlan];
  if (recommendation?.actions?.length) return [...recommendation.actions];
  return ["Review the assumptions", "Validate the strongest risks", "Recalculate with updated inputs"];
}

function deriveAssumptions(workflow: DecisionWorkflow): string[] {
  return workflow.assumptions ? [...workflow.assumptions] : [];
}

function ensurePlugin(workflow: DecisionWorkflow): DecisionPlugin {
  const plugin = decisionPluginRegistry.getPlugin(workflow.pluginId);
  return plugin ?? {
    id: workflow.pluginId,
    name: workflow.pluginId,
    version: "0",
    categories: workflow.category ? [workflow.category] : [],
    keywords: workflow.intent.keywords,
    relatedCalculators: workflow.relatedCalculators ?? [],
    relatedTools: workflow.relatedTools ?? [],
    knowledgeAssumptions: (workflow.assumptions ?? []).map((description, index) => ({ id: `${workflow.pluginId}:assumption:${index}`, description })),
    workflows: [workflow],
  };
}

function fallbackScore(workflow: DecisionWorkflow) {
  return {
    value: 0,
    max: 100 as const,
    percentage: 0,
    label: workflow.title,
    factors: [],
  };
}

export function normalizeDecision(input: DecisionRepositoryInput): DecisionRepositoryDecision {
  const workflow = input.workflow;
  const report = input.report;
  const recommendation = input.recommendation ?? report?.recommendation ?? defaultRecommendation(workflow);
  const score = input.score ?? report?.score ?? fallbackScore(workflow);
  const createdAt = input.createdAt ?? report?.generatedAt ?? nowIso();
  const updatedAt = input.updatedAt ?? report?.generatedAt ?? createdAt;
  return {
    ...input,
    plugin: input.plugin ?? ensurePlugin(workflow),
    workflow,
    question: input.question ?? workflow.title,
    score,
    confidence: typeof input.confidence === "number" ? input.confidence : (report ? deriveConfidence(report) : Math.round(score.percentage)),
    riskLevel: input.riskLevel ?? deriveRiskLevel(report),
    recommendation,
    actionPlan: deriveActionPlan(report, recommendation),
    assumptions: input.assumptions ?? deriveAssumptions(workflow),
    createdAt,
    updatedAt,
    id: input.id ?? `${workflow.pluginId}:${workflow.slug}:${createdAt}`,
  };
}

export function buildDecisionRecord(input: {
  workflow: DecisionWorkflow;
  report: DecisionReport;
  answers: DecisionRepositoryDecision["answers"];
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  question?: string;
  plugin?: DecisionPlugin;
}): DecisionRepositoryDecision {
  return normalizeDecision({
    id: input.id,
    pluginId: input.workflow.pluginId,
    workflowId: input.workflow.id,
    plugin: input.plugin ?? ensurePlugin(input.workflow),
    workflow: input.workflow,
    question: input.question ?? input.workflow.title,
    answers: input.answers,
    score: input.report.score,
    confidence: Math.round(input.report.score.percentage),
    riskLevel: deriveRiskLevel(input.report),
    recommendation: input.report.recommendation ?? defaultRecommendation(input.workflow),
    actionPlan: input.report.actionPlan,
    assumptions: input.workflow.assumptions ?? [],
    report: input.report,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  });
}

export interface DecisionRepository {
  listDecisions(): Promise<DecisionRepositoryDecision[]>;
  getDecision(id: string): Promise<DecisionRepositoryDecision | undefined>;
  saveDecision(decision: DecisionRepositoryInput): Promise<DecisionRepositoryDecision>;
  deleteDecision(id: string): Promise<void>;
}
