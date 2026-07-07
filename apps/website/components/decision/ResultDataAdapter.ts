import type { DecisionAnswers, DecisionReport, DecisionWorkflow } from "@datastorified/decision-os";
import type { ProfileAnalysis } from "@datastorified/profile";
import type { ResultDataAdapterInput, ResultDataAdapterOutput, WorkflowResultConfig } from "./resultTypes";

export function adaptResultData(input: ResultDataAdapterInput): ResultDataAdapterOutput {
  return {
    ...input,
    config: normalizeResultConfig(input.workflow, input.config),
    safeSummary: safeResultSummary(input.report, input.workflow),
    safeDisclaimer: safeResultDisclaimer(input.config?.disclaimerType ?? inferDisclaimerType(input.workflow)),
  };
}

export function normalizeResultConfig(workflow: DecisionWorkflow, config?: WorkflowResultConfig): WorkflowResultConfig {
  return {
    workflowId: workflow.id,
    sections: {
      summary: true,
      score_breakdown: true,
      trade_offs: true,
      scenario_simulator: true,
      action_plan: true,
      disclaimer: true,
      save_share: true,
      review_reminder: true,
      related_decisions: true,
      ...(config?.sections ?? {}),
    },
    relatedDecisionSlugs: config?.relatedDecisionSlugs ?? [],
    disclaimerType: config?.disclaimerType ?? inferDisclaimerType(workflow),
  };
}

export function safeResultSummary(report: DecisionReport, workflow: DecisionWorkflow): string {
  const score = Math.round(report.score.value);
  const recommendation = report.recommendation ?? { title: "Review the result", summary: "", actions: [] };
  const nextStep = report.actionPlan[0] ?? recommendation.actions[0] ?? "Review assumptions";
  return `${workflow.title}\nScore: ${score}/100 — ${report.score.label ?? "Decision profile"}\nOutcome: ${recommendation.title}\n${recommendation.summary ?? ""}\nNext: ${nextStep}`;
}

export function safeResultDisclaimer(type: WorkflowResultConfig["disclaimerType"]): string {
  const unsafeWords = ["guarantee", "advice", "recommend", "should invest", "buy now"];
  const copy = safeCopyForType(type);
  if (unsafeWords.some((word) => copy.toLowerCase().includes(word))) return safeCopyForType(type);
  return copy;
}

export function safeCopyForType(type: WorkflowResultConfig["disclaimerType"] = "none"): string {
  switch (type) {
    case "finance":
      return "This result is educational and helps compare trade-offs. It does not replace independent financial review.";
    case "insurance":
      return "This result is educational and helps compare coverage trade-offs. It does not replace licensed advice.";
    case "legal":
      return "This result is educational and helps structure your thinking. It does not replace legal advice.";
    case "health":
      return "This result is educational and helps organize your thinking. It does not replace medical advice.";
    default:
      return "This result is educational and helps compare trade-offs. Verify the important details independently.";
  }
}

export function inferDisclaimerType(workflow: DecisionWorkflow): WorkflowResultConfig["disclaimerType"] {
  const category = String(workflow.category ?? "").toLowerCase();
  if (category.includes("investment") || category.includes("debt") || category.includes("property")) return "finance";
  if (category.includes("insurance")) return "insurance";
  if (category.includes("health")) return "health";
  if (category.includes("legal")) return "legal";
  return "none";
}

export function resultDecisionSignalLabel(profileAnalysis?: Pick<ProfileAnalysis, "label" | "description" | "nextBestField" | "percentage">) {
  return profileAnalysis?.nextBestField ? `Improve with ${profileAnalysis.nextBestField.label}` : "Optional profile signal";
}

export function getResultAnswers(report: DecisionReport, answers?: DecisionAnswers): DecisionAnswers {
  return answers ?? report.answers ?? {};
}
