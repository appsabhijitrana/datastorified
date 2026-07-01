import { buildDecisionReport } from "./reportEngine";
import type { DecisionAnswers, DecisionReport, DecisionScenario, DecisionScenarioResult, DecisionWorkflow } from "../types";
import { round } from "../utils/math";

export function recalculateScenario(
  workflow: DecisionWorkflow,
  baseAnswers: DecisionAnswers,
  scenario: DecisionScenario,
  baseReport?: DecisionReport,
): DecisionScenarioResult {
  const answers = { ...baseAnswers, ...scenario.overrides };
  const report = buildDecisionReport(workflow, answers);
  const baseline = baseReport ?? buildDecisionReport(workflow, baseAnswers);
  return { scenario, answers, report, scoreDelta: round(report.score.value - baseline.score.value) };
}

export function recalculateScenarios(
  workflow: DecisionWorkflow,
  baseAnswers: DecisionAnswers,
  scenarios: readonly DecisionScenario[] = workflow.scenarios ?? [],
): DecisionScenarioResult[] {
  const baseReport = buildDecisionReport(workflow, baseAnswers);
  return scenarios.map((scenario) => recalculateScenario(workflow, baseAnswers, scenario, baseReport));
}
