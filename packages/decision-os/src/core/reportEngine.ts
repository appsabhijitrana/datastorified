import { evaluateRules } from "./ruleEngine";
import { calculateDecisionScore } from "./scoreEngine";
import { identifyRisks } from "./riskEngine";
import { selectActionPlan, selectRecommendation } from "./recommendationEngine";
import { createDecisionId } from "../utils/ids";
import type { DecisionAnswers, DecisionFacts, DecisionReport, DecisionWorkflow } from "../types";

export type ReportOptions = {
  id?: string;
  generatedAt?: string;
};

export function buildDecisionFacts(workflow: DecisionWorkflow, answers: DecisionAnswers): DecisionFacts {
  return { ...answers, ...(workflow.deriveFacts?.(answers) ?? {}) };
}

export function buildDecisionReport(workflow: DecisionWorkflow, answers: DecisionAnswers, options: ReportOptions = {}): DecisionReport {
  const facts = buildDecisionFacts(workflow, answers);
  const ruleEvaluations = evaluateRules(workflow.rules, facts);
  const score = calculateDecisionScore(workflow.weights, ruleEvaluations, workflow.scoreBands);
  const recommendation = selectRecommendation(workflow.recommendations, score.value, facts);
  const configuredActionPlan = selectActionPlan(workflow.actionPlanTemplates ?? [], score.value, facts);
  return {
    id: options.id ?? createDecisionId("report"),
    workflowId: workflow.id,
    pluginId: workflow.pluginId,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    answers: { ...answers },
    facts,
    ruleEvaluations,
    score,
    risks: identifyRisks(ruleEvaluations),
    recommendation,
    actionPlan: configuredActionPlan.length > 0 ? configuredActionPlan : recommendation?.actions ?? [],
  };
}
