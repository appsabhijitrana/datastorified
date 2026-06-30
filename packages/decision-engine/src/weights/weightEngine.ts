import type { DecisionFactorDefinition } from "../types";
export function normalizeWeights(factors: DecisionFactorDefinition[]): DecisionFactorDefinition[] {
  const total = factors.reduce((sum, factor) => sum + Math.max(0, factor.weight), 0);
  if (!total) return factors.map((factor) => ({ ...factor, weight: 0 }));
  return factors.map((factor) => ({ ...factor, weight: factor.weight / total * 100 }));
}
