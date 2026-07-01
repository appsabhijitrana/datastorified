import { evaluateConditionGroup } from "./ruleEngine";
import type { DecisionFacts, DecisionRecommendation } from "../types";

export function selectRecommendation(
  recommendations: readonly DecisionRecommendation[],
  score: number,
  facts: DecisionFacts = {},
): DecisionRecommendation | undefined {
  return recommendations.find((recommendation) => score >= recommendation.minScore && score <= recommendation.maxScore && evaluateConditionGroup(recommendation.when, facts));
}
