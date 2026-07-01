import { evaluateRules } from "./ruleEngine";
import { calculateDecisionScore } from "./scoreEngine";
import { identifyRisks } from "./riskEngine";
import { selectRecommendation } from "./recommendationEngine";
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
    recommendation: selectRecommendation(workflow.recommendations, score.value, facts),
  };
}
