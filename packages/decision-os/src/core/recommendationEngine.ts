import { evaluateConditionGroup } from "./ruleEngine";
import { clamp, round } from "../utils/math";
import type {
  DecisionActionPlanTemplate,
  DecisionAnswers,
  DecisionFacts,
  DecisionOptionScore,
  DecisionRecommendation,
  DecisionRecommendationAlternative,
  DecisionRecommendationResult,
  DecisionRiskAssessment,
  DecisionWorkflow,
} from "../types";

type WinnerCandidate = DecisionOptionScore & {
  riskScore: number;
  riskLevel: DecisionRiskAssessment["riskLevel"];
  adjustedScore: number;
};

function buildFacts(workflow: Readonly<DecisionWorkflow>, answers: Readonly<DecisionAnswers>): DecisionFacts {
  return { ...answers, ...(workflow.deriveFacts?.(answers) ?? {}) };
}

function getRiskForOption(risks: readonly DecisionRiskAssessment[], optionId: string): DecisionRiskAssessment | undefined {
  return risks.find((risk) => risk.optionId === optionId);
}

function getAdjustedScore(option: DecisionOptionScore, riskScore: number): number {
  const confidenceBonus = option.confidence * 0.12;
  const riskPenalty = riskScore * 0.45;
  return clamp(round(option.totalScore - riskPenalty + confidenceBonus), 0, 100);
}

function tieBreakScore(candidate: WinnerCandidate): number {
  return candidate.adjustedScore * 100 + candidate.confidence - candidate.riskScore;
}

function buildWinnerCandidate(option: DecisionOptionScore, risks: readonly DecisionRiskAssessment[]): WinnerCandidate {
  const risk = getRiskForOption(risks, option.optionId);
  const riskLevel = risk?.riskLevel ?? "low";
  const riskScore = risk?.riskScore ?? 0;
  return {
    ...option,
    riskScore,
    riskLevel,
    adjustedScore: getAdjustedScore(option, riskScore),
  };
}

function summarizeRecommendation(winner: WinnerCandidate, recommendation: DecisionRecommendation | undefined): string {
  const base = recommendation?.summary ?? `The selected option, ${winner.label}, best balances the current inputs.`;
  const riskNote = winner.riskLevel === "high"
    ? " The choice remains higher risk and deserves careful validation."
    : winner.riskLevel === "medium"
      ? " There are still moderate risks to review."
      : "";
  return `${base}${riskNote}`.trim();
}

function buildAlternativeTradeOffs(winner: WinnerCandidate, alternative: WinnerCandidate): string[] {
  const tradeOffs: string[] = [];
  if (winner.totalScore > alternative.totalScore) tradeOffs.push(`Higher overall score than ${alternative.label}.`);
  else if (winner.totalScore < alternative.totalScore) tradeOffs.push(`Won despite a lower raw score because it is less risky than ${alternative.label}.`);
  if (winner.riskLevel !== alternative.riskLevel) tradeOffs.push(`Lower risk than ${alternative.label}.`);
  if (winner.confidence !== alternative.confidence) tradeOffs.push(`Confidence differs from ${alternative.label}.`);
  if (tradeOffs.length === 0) tradeOffs.push(`Different balance of score, confidence, and risk than ${alternative.label}.`);
  return tradeOffs;
}

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

export function selectWinner(scores: readonly DecisionOptionScore[], risks: readonly DecisionRiskAssessment[]): WinnerCandidate | undefined {
  if (!scores.length) return undefined;
  return scores
    .map((score) => buildWinnerCandidate(score, risks))
    .sort((left, right) => {
      if (right.adjustedScore !== left.adjustedScore) return right.adjustedScore - left.adjustedScore;
      if (right.confidence !== left.confidence) return right.confidence - left.confidence;
      if (right.riskScore !== left.riskScore) return left.riskScore - right.riskScore;
      return left.optionId.localeCompare(right.optionId);
    })[0];
}

export function generateWhyThisWins(winner: WinnerCandidate, scores: readonly DecisionOptionScore[], risks: readonly DecisionRiskAssessment[]): string[] {
  const runnerUp = scores
    .filter((score) => score.optionId !== winner.optionId)
    .map((score) => buildWinnerCandidate(score, risks))
    .sort((left, right) => tieBreakScore(right) - tieBreakScore(left))[0];
  const reasons: string[] = [];

  if (winner.strengths.length) {
    reasons.push(`Strongest inputs: ${winner.strengths.slice(0, 2).join(" and ")}.`);
  }
  reasons.push(`Adjusted score of ${winner.adjustedScore} after considering confidence and risk.`);
  if (runnerUp) {
    const gap = round(winner.adjustedScore - runnerUp.adjustedScore, 2);
    reasons.push(`Outperforms ${runnerUp.label} by ${gap} points on the risk-adjusted ranking.`);
  }
  if (winner.riskScore <= 20) {
    reasons.push("The option keeps risk relatively contained.");
  } else if (winner.riskLevel === "high") {
    reasons.push("It wins despite higher risk, so the conclusion should be handled carefully.");
  }
  return reasons;
}

export function generateTradeOffs(winner: WinnerCandidate, alternatives: readonly WinnerCandidate[]): string[] {
  if (!alternatives.length) return ["No alternative options were available to compare."];
  return alternatives.slice(0, 3).flatMap((alternative) => buildAlternativeTradeOffs(winner, alternative));
}

export function generateBestFor(winner: WinnerCandidate, answers: Readonly<DecisionAnswers>): string[] {
  const bestFor: string[] = [];
  if (winner.strengths.length) {
    bestFor.push(`Best for decisions that prioritize ${winner.strengths[0].toLowerCase()}.`);
  }
  if (winner.strengths[1]) {
    bestFor.push(`Also works well when ${winner.strengths[1].toLowerCase()} matters.`);
  }
  const answeredCount = Object.values(answers).filter((value) => value !== undefined && value !== null && value !== "").length;
  if (answeredCount > 0) {
    bestFor.push(`Best for the priorities reflected in your ${answeredCount} provided answer${answeredCount === 1 ? "" : "s"}.`);
  }
  if (!bestFor.length) {
    bestFor.push("Best for the balance of inputs currently provided.");
  }
  return bestFor;
}

export function generateAvoidIf(winner: WinnerCandidate, answers: Readonly<DecisionAnswers>, risks: readonly DecisionRiskAssessment[]): string[] {
  const avoidIf: string[] = [];
  if (winner.riskLevel === "high") {
    avoidIf.push("Avoid this option if you need a low-risk decision.");
  }
  if (winner.weaknesses.length) {
    avoidIf.push(`Avoid if ${winner.weaknesses[0].toLowerCase()} cannot be improved.`);
  }
  const missing = Object.entries(answers)
    .filter(([, value]) => value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0))
    .map(([key]) => key);
  if (missing.length) {
    avoidIf.push(`Avoid if the missing inputs (${missing.slice(0, 2).join(", ")}) remain unresolved.`);
  }
  if (risks.some((risk) => risk.riskLevel === "high")) {
    avoidIf.push("Avoid if you are not comfortable with the identified high-risk factors.");
  }
  return avoidIf.length ? avoidIf : ["Avoid if your priorities change materially before you act."];
}

export function generateRecommendation(
  workflow: Readonly<DecisionWorkflow>,
  answers: Readonly<DecisionAnswers>,
  scores: readonly DecisionOptionScore[],
  risks: readonly DecisionRiskAssessment[],
): DecisionRecommendationResult {
  const winner = selectWinner(scores, risks);
  if (!winner) {
    return {
      winnerOptionId: "",
      summary: "No recommendation could be generated because no scored options were available.",
      confidence: 0,
      whyThisWins: [],
      tradeOffs: [],
      bestFor: [],
      avoidIf: [],
      alternativeOptions: [],
      disclaimerNote: "This output is informational only and should be checked against the final real-world details.",
    };
  }

  const facts = buildFacts(workflow, answers);
  const selectedRecommendation = selectRecommendation(workflow.recommendations, winner.adjustedScore, facts);
  const alternatives = scores
    .map((score) => buildWinnerCandidate(score, risks))
    .filter((candidate) => candidate.optionId !== winner.optionId)
    .sort((left, right) => tieBreakScore(right) - tieBreakScore(left));
  const topAlternative = alternatives[0];
  const alternativeOptions: DecisionRecommendationAlternative[] = alternatives.slice(0, 3).map((alternative) => ({
    optionId: alternative.optionId,
    label: alternative.label,
    totalScore: alternative.totalScore,
    confidence: alternative.confidence,
    riskScore: alternative.riskScore,
    riskLevel: alternative.riskLevel,
    adjustedScore: alternative.adjustedScore,
    strengths: alternative.strengths,
    weaknesses: alternative.weaknesses,
    whyNotWinner: winner.adjustedScore > alternative.adjustedScore
      ? `${winner.label} is stronger after weighing risk and confidence.`
      : `${alternative.label} remains a credible alternative.`,
    tradeOffs: buildAlternativeTradeOffs(winner, alternative),
  }));

  const whyThisWins = generateWhyThisWins(winner, scores, risks);
  const tradeOffs = generateTradeOffs(winner, alternatives.slice(0, 3));
  const bestFor = generateBestFor(winner, answers);
  const avoidIf = generateAvoidIf(winner, answers, risks);
  const summary = summarizeRecommendation(winner, selectedRecommendation);
  const confidence = clamp(round((winner.confidence * 0.7) + (winner.adjustedScore >= 60 ? 15 : 0) - (winner.riskScore >= 70 ? 10 : 0)), 0, 100);
  const disclaimerNote = topAlternative && Math.abs(winner.adjustedScore - topAlternative.adjustedScore) <= 5
    ? "The top options are close; a small change in assumptions could change the result."
    : "This recommendation is deterministic and should be rechecked if key assumptions change.";

  return {
    winnerOptionId: winner.optionId,
    summary,
    confidence,
    whyThisWins,
    tradeOffs,
    bestFor,
    avoidIf,
    alternativeOptions,
    disclaimerNote,
  };
}

export class RecommendationEngine {
  generateRecommendation(
    workflow: Readonly<DecisionWorkflow>,
    answers: Readonly<DecisionAnswers>,
    scores: readonly DecisionOptionScore[],
    risks: readonly DecisionRiskAssessment[],
  ): DecisionRecommendationResult {
    return generateRecommendation(workflow, answers, scores, risks);
  }

  selectWinner(scores: readonly DecisionOptionScore[], risks: readonly DecisionRiskAssessment[]): WinnerCandidate | undefined {
    return selectWinner(scores, risks);
  }

  generateWhyThisWins(winner: WinnerCandidate, scores: readonly DecisionOptionScore[], risks: readonly DecisionRiskAssessment[]): string[] {
    return generateWhyThisWins(winner, scores, risks);
  }

  generateTradeOffs(winner: WinnerCandidate, alternatives: readonly WinnerCandidate[]): string[] {
    return generateTradeOffs(winner, alternatives);
  }

  generateBestFor(winner: WinnerCandidate, answers: Readonly<DecisionAnswers>): string[] {
    return generateBestFor(winner, answers);
  }

  generateAvoidIf(winner: WinnerCandidate, answers: Readonly<DecisionAnswers>, risks: readonly DecisionRiskAssessment[]): string[] {
    return generateAvoidIf(winner, answers, risks);
  }
}

export const recommendationEngine = new RecommendationEngine();
