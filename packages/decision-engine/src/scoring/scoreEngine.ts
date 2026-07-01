import type { DecisionConfig, ScoreResult } from "../types";
import { clamp, round } from "../utils/math";
import { normalizeWeights } from "../weights/weightEngine";
import { evaluateRules } from "../rules/ruleEngine";
import { getScoreLabel } from "./scoreLabels";

export function calculateScore(config: DecisionConfig, metrics: Record<string, number | string | boolean>, answerProgress = 100): ScoreResult {
  const evaluations = evaluateRules(config.rules, metrics);
  const factors = normalizeWeights(config.factors).map((factor) => {
    const relevant = evaluations.filter((item) => item.factor === factor.id && item.matched);
    const score = clamp(65 + relevant.reduce((total, item) => total + (item.effect.type === "bonus" ? item.effect.score : -item.effect.score), 0));
    return { ...factor, score: round(score), status: score >= 71 ? "good" as const : score >= 51 ? "caution" as const : "risk" as const };
  });
  const score = round(factors.reduce((total, factor) => total + factor.score * factor.weight / 100, 0));
  const highRisks = evaluations.filter((item) => item.matched && item.effect.type === "penalty" && item.effect.severity === "high").length;
  return { score, label: getScoreLabel(score), confidence: round(Math.min(1, .45 + answerProgress / 100 * .5 + Math.min(config.rules.length, 5) * .01), 2), riskLevel: highRisks >= 2 || score <= 40 ? "high" : highRisks || score <= 65 ? "medium" : "low", factors, evaluations };
}
