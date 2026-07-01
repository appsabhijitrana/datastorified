import type { DecisionAnalysis, DecisionAnswers, DecisionConfig } from "./types";
import { runCalculatorBridge } from "./calculators/calculatorBridge";
import { getProgress } from "./questions/questionEngine";
import { calculateScore } from "./scoring/scoreEngine";
import { calculateRisk } from "./risk/riskEngine";
import { buildRecommendation } from "./recommendation/recommendationEngine";

export function analyzeDecision(config: DecisionConfig, answers: DecisionAnswers): DecisionAnalysis {
  const { metrics } = runCalculatorBridge(config, answers);
  const score = calculateScore(config, metrics, getProgress(config, answers));
  const risk = calculateRisk(score.evaluations);
  return { config, answers, metrics, score, risk, recommendation: buildRecommendation(config, score, risk) };
}
