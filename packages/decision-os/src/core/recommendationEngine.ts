import { evaluateConditionGroup } from "./ruleEngine";
import type { DecisionActionPlanTemplate, DecisionFacts, DecisionRecommendation } from "../types";

export function selectRecommendation(
  recommendations: readonly DecisionRecommendation[],
  score: number,
  facts: DecisionFacts = {},
): DecisionRecommendation | undefined {
  return recommendations.find((recommendation) => score >= recommendation.minScore && score <= recommendation.maxScore && evaluateConditionGroup(recommendation.when, facts));
}

export function selectActionPlan(
  templates: readonly DecisionActionPlanTemplate[],
  score: number,
  facts: DecisionFacts = {},
): string[] {
  return templates.find((template) => score >= template.minScore && score <= template.maxScore && evaluateConditionGroup(template.when, facts))?.actions ?? [];
}
