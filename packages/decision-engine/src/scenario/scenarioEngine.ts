import type { DecisionAnalysis, DecisionAnswers, DecisionConfig } from "../types";
import { analyzeDecision } from "../analysis";
export const runScenario = (config: DecisionConfig, baseAnswers: DecisionAnswers, changes: DecisionAnswers): DecisionAnalysis => analyzeDecision(config, { ...baseAnswers, ...changes });
export const compareScenarios = (base: DecisionAnalysis, scenario: DecisionAnalysis) => ({ before: base.score.score, after: scenario.score.score, delta: scenario.score.score - base.score.score, riskBefore: base.risk.riskScore, riskAfter: scenario.risk.riskScore });
