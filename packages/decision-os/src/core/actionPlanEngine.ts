import { evaluateConditionGroup } from "./ruleEngine";
import type {
  DecisionActionPlanResult,
  DecisionAnswers,
  DecisionRecommendationResult,
  DecisionRiskAssessment,
  DecisionWorkflow,
} from "../types";

type ActionCandidate = {
  text: string;
  source: "workflow" | "risk" | "recommendation" | "follow-up";
  priority: number;
  effort: number;
  timeline: number;
};

function isAnswered(value: DecisionAnswers[string]): boolean {
  return value !== undefined && value !== null && value !== "" && (!Array.isArray(value) || value.length > 0);
}

function dedupeActions(actions: readonly ActionCandidate[]): ActionCandidate[] {
  const seen = new Set<string>();
  const output: ActionCandidate[] = [];
  for (const action of actions) {
    const key = action.text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(action);
  }
  return output;
}

function effortLabel(totalSteps: number, priority: DecisionActionPlanResult["priority"]): string {
  if (totalSteps <= 2 && priority === "low") return "Low effort";
  if (totalSteps <= 4 && priority !== "high") return "Moderate effort";
  return "Meaningful effort";
}

function timelineLabel(priority: DecisionActionPlanResult["priority"], totalSteps: number): string {
  if (priority === "high") return totalSteps <= 3 ? "Within 24 hours" : "Within 2–3 days";
  if (priority === "medium") return totalSteps <= 4 ? "Within a week" : "Within 1–2 weeks";
  return "Within 2–4 weeks";
}

export function prioritizeActions(actions: readonly ActionCandidate[]): ActionCandidate[] {
  return [...actions].sort((left, right) => {
    if (right.priority !== left.priority) return right.priority - left.priority;
    if (right.effort !== left.effort) return left.effort - right.effort;
    if (right.timeline !== left.timeline) return left.timeline - right.timeline;
    return left.text.localeCompare(right.text);
  });
}

export function generateRiskMitigationActions(risks: readonly DecisionRiskAssessment[]): string[] {
  const actions = risks.flatMap((risk) =>
    risk.mitigationTips.length > 0
      ? risk.mitigationTips.map((tip) => `Mitigate ${risk.optionId}: ${tip}`)
      : [`Mitigate ${risk.optionId}: address ${risk.riskLevel} risk factors before acting.`],
  );
  return [...new Set(actions)];
}

export function generateFollowUpActions(workflow: Readonly<DecisionWorkflow>, recommendation: Readonly<DecisionRecommendationResult>): string[] {
  const selected = workflow.recommendations.find((item) =>
    item.id === recommendation.winnerOptionId || (recommendation.summary.toLowerCase().includes(item.title.toLowerCase()) && recommendation.summary.length > 0),
  );
  const actionTexts = selected?.actions ?? [];
  const followUps = actionTexts.map((action) => `Review: ${action}`);
  if (!followUps.length) {
    followUps.push(`Review the recommended next step for ${workflow.title}.`);
  }
  return followUps;
}

export function generateActionPlan(
  workflow: Readonly<DecisionWorkflow>,
  answers: Readonly<DecisionAnswers>,
  recommendation: Readonly<DecisionRecommendationResult>,
  risks: readonly DecisionRiskAssessment[],
): DecisionActionPlanResult {
  const answerCount = Object.values(answers).filter(isAnswered).length;
  const highRiskCount = risks.filter((risk) => risk.riskLevel === "high").length;
  const mediumRiskCount = risks.filter((risk) => risk.riskLevel === "medium").length;
  const priority: DecisionActionPlanResult["priority"] = highRiskCount > 0
    ? "high"
    : mediumRiskCount > 0 || recommendation.confidence < 70
      ? "medium"
      : "low";

  const workflowCandidates: ActionCandidate[] = [];
  for (const template of workflow.actionPlanTemplates ?? []) {
    const facts = { ...answers, ...(workflow.deriveFacts?.(answers) ?? {}) };
    if (evaluateConditionGroup(template.when, facts)) {
      workflowCandidates.push(
        ...template.actions.map((text, index) => ({
          text,
          source: "workflow" as const,
          priority: 70 - index * 2,
          effort: index + 1,
          timeline: index + 1,
        })),
      );
    }
  }

  const recommendationCandidates: ActionCandidate[] = recommendation.alternativeOptions.length > 0
    ? recommendation.alternativeOptions.slice(0, 3).flatMap((alternative, index) => [
      {
        text: `Consider ${alternative.label}: ${alternative.whyNotWinner}`,
        source: "recommendation" as const,
        priority: 55 - index * 5,
        effort: 2 + index,
        timeline: 2 + index,
      },
      ...alternative.tradeOffs.slice(0, 2).map((tradeOff, tradeOffIndex) => ({
        text: `${tradeOff}`,
        source: "recommendation" as const,
        priority: 48 - tradeOffIndex * 4 - index,
        effort: 2,
        timeline: 2,
      })),
    ])
    : [];

  const riskCandidates: ActionCandidate[] = generateRiskMitigationActions(risks).map((text, index) => ({
    text,
    source: "risk" as const,
    priority: 90 - index * 4,
    effort: 1 + index,
    timeline: 1 + index,
  }));

  const followUpCandidates: ActionCandidate[] = generateFollowUpActions(workflow, recommendation).map((text, index) => ({
    text,
    source: "follow-up" as const,
    priority: 60 - index * 3,
    effort: 1 + index,
    timeline: 1 + index,
  }));

  const planningNotes: ActionCandidate[] = [];
  if (answerCount === 0) {
    planningNotes.push({
      text: "Capture the missing answers before you commit.",
      source: "follow-up",
      priority: 80,
      effort: 1,
      timeline: 1,
    });
  }
  if (recommendation.disclaimerNote) {
    planningNotes.push({
      text: recommendation.disclaimerNote,
      source: "follow-up",
      priority: 30,
      effort: 1,
      timeline: 3,
    });
  }

  const prioritized = prioritizeActions(
    dedupeActions([
      ...riskCandidates,
      ...workflowCandidates,
      ...followUpCandidates,
      ...recommendationCandidates,
      ...planningNotes,
    ]),
  );

  const steps = prioritized.slice(0, 6).map((action) => action.text);
  const summary = recommendation.summary;
  const recommendedTimeline = timelineLabel(priority, steps.length);
  return {
    title: `${workflow.title} action plan`,
    summary,
    steps,
    priority,
    estimatedEffort: effortLabel(steps.length, priority),
    recommendedTimeline,
    followUpQuestions: workflow.questions
      .filter((question) => question.required !== false && !isAnswered(answers[question.id]))
      .slice(0, 3)
      .map((question) => `What is your ${question.prompt.toLowerCase()}?`)
      .concat(
        workflow.questions.filter((question) => question.helperText && isAnswered(answers[question.id])).slice(0, 2).map((question) => `Should we revisit ${question.prompt.toLowerCase()} later?`),
      ),
  };
}

export class ActionPlanEngine {
  generateActionPlan(
    workflow: Readonly<DecisionWorkflow>,
    answers: Readonly<DecisionAnswers>,
    recommendation: Readonly<DecisionRecommendationResult>,
    risks: readonly DecisionRiskAssessment[],
  ): DecisionActionPlanResult {
    return generateActionPlan(workflow, answers, recommendation, risks);
  }

  prioritizeActions(actions: readonly ActionCandidate[]): ActionCandidate[] {
    return prioritizeActions(actions);
  }

  generateRiskMitigationActions(risks: readonly DecisionRiskAssessment[]): string[] {
    return generateRiskMitigationActions(risks);
  }

  generateFollowUpActions(workflow: Readonly<DecisionWorkflow>, recommendation: Readonly<DecisionRecommendationResult>): string[] {
    return generateFollowUpActions(workflow, recommendation);
  }
}

export const actionPlanEngine = new ActionPlanEngine();
