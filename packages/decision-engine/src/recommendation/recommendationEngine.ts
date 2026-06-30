import type { DecisionConfig, Recommendation, RiskResult, ScoreResult } from "../types";
export function buildRecommendation(config: DecisionConfig, score: ScoreResult, risk: RiskResult): Recommendation {
  const template = [...config.recommendations].sort((a, b) => b.minScore - a.minScore).find((item) => score.score >= item.minScore) ?? config.recommendations[config.recommendations.length - 1];
  const reasons = score.evaluations.filter((item) => item.matched).slice(0, 4).map((item) => item.message);
  const riskActions = risk.risks.slice(0, 2).map((item) => `Address: ${item.message}`);
  const actionPlan = [...riskActions, ...template.actions].slice(0, 5);
  return { verdict: template.verdict, summary: template.summary, reasons: reasons.length ? reasons : ["The current inputs produce a balanced base case."], pros: template.pros, cons: template.cons, actionPlan, nextBestAction: actionPlan[0] ?? "Review the most sensitive assumption." };
}
