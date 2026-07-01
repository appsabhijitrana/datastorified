import type { RiskResult, RuleEvaluation } from "../types";
import { clamp } from "../utils/math";
export function calculateRisk(evaluations: RuleEvaluation[]): RiskResult {
  const matched = evaluations.filter((item) => item.matched && item.effect.type === "penalty");
  const severityPoints = { low: 10, medium: 20, high: 35 } as const;
  const riskScore = clamp(matched.reduce((sum, item) => sum + severityPoints[item.effect.severity], 0));
  return { riskScore, riskLevel: riskScore >= 65 ? "high" : riskScore >= 30 ? "medium" : "low", risks: matched.map((item) => ({ id: item.id, label: item.label, severity: item.effect.severity, message: item.message })) };
}
