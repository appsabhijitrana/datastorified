import { calculateFactorScores } from "./weightEngine";
import type { DecisionRuleEvaluation, DecisionScore, DecisionWeight } from "../types";
import { clamp, round } from "../utils/math";

export function calculateDecisionScore(
  weights: readonly DecisionWeight[],
  evaluations: readonly DecisionRuleEvaluation[],
  scoreBands: ReadonlyArray<{ min: number; max: number; label: string }> = [],
): DecisionScore {
  const factors = calculateFactorScores(weights, evaluations);
  const value = clamp(round(factors.reduce((sum, factor) => sum + factor.contribution, 0)), 0, 100);
  return {
    value,
    max: 100,
    percentage: value,
    label: scoreBands.find((band) => value >= band.min && value <= band.max)?.label,
    factors,
  };
}
