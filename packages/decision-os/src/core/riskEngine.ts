import type { DecisionRisk, DecisionRuleEvaluation } from "../types";

const severityRank: Record<DecisionRisk["severity"], number> = { low: 1, medium: 2, high: 3, critical: 4 };

export function identifyRisks(evaluations: readonly DecisionRuleEvaluation[]): DecisionRisk[] {
  return evaluations
    .filter((evaluation) => evaluation.matched && evaluation.rule.risk)
    .map(({ rule }) => ({ ...rule.risk!, sourceRuleId: rule.id }))
    .sort((left, right) => severityRank[right.severity] - severityRank[left.severity]);
}
