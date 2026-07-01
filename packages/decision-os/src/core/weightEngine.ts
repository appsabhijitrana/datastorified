import type { DecisionFactorScore, DecisionRuleEvaluation, DecisionWeight } from "../types";
import { clamp, round } from "../utils/math";

export function normalizeWeights(weights: readonly DecisionWeight[]): Array<DecisionWeight & { normalizedWeight: number }> {
  if (weights.some(({ weight }) => weight < 0)) throw new Error("Decision weights cannot be negative.");
  const total = weights.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0) throw new Error("Decision weights must have a positive total.");
  return weights.map((item) => ({ ...item, normalizedWeight: item.weight / total }));
}

export function calculateFactorScores(weights: readonly DecisionWeight[], evaluations: readonly DecisionRuleEvaluation[], defaultBaseline = 50): DecisionFactorScore[] {
  return normalizeWeights(weights).map((weight) => {
    let score = weight.baselineScore ?? defaultBaseline;
    for (const { rule, matched } of evaluations) {
      if (!matched || rule.factorId !== weight.factorId || !rule.scoreEffect) continue;
      const { operation, value } = rule.scoreEffect;
      if (operation === "set") score = value;
      else if (operation === "add") score += value;
      else score -= value;
    }
    score = clamp(score, 0, 100);
    return {
      factorId: weight.factorId,
      label: weight.label,
      score: round(score),
      weight: weight.weight,
      normalizedWeight: round(weight.normalizedWeight, 6),
      contribution: round(score * weight.normalizedWeight),
    };
  });
}
