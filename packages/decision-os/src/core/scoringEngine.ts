import { clamp, round } from "../utils/math";
import type {
  DecisionAnswers,
  DecisionOptionScore,
  DecisionScoringFactorBreakdown,
  DecisionScoringOption,
  DecisionScoreDirection,
  DecisionWorkflow,
} from "../types";

export type ScoreFactorInput = {
  weight: number;
  rawScore: number | null;
  normalizedScore: number;
  direction: DecisionScoreDirection;
  explanation?: string;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function coerceAnswerToNumber(answer: DecisionAnswers[string]): number | null {
  if (typeof answer === "number" && Number.isFinite(answer)) return answer;
  if (typeof answer === "boolean") return answer ? 1 : 0;
  if (typeof answer === "string") {
    const parsed = Number(answer);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function sortByScore<T extends { totalScore: number; confidence: number }>(scores: readonly T[]): T[] {
  return scores
    .map((score, index) => ({ score, index }))
    .sort((left, right) => {
      if (right.score.totalScore !== left.score.totalScore) return right.score.totalScore - left.score.totalScore;
      if (right.score.confidence !== left.score.confidence) return right.score.confidence - left.score.confidence;
      return left.index - right.index;
    })
    .map(({ score }) => score);
}

function getRelevantQuestionIds(option: DecisionScoringOption): Set<string> {
  const ids = new Set<string>();
  for (const factor of option.factors) {
    if (factor.questionId) ids.add(factor.questionId);
  }
  return ids;
}

export function normalizeScore(value: number, min: number, max: number, direction: DecisionScoreDirection = "higher_better"): number {
  if (!Number.isFinite(value)) return 0;
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  if (!Number.isFinite(low) || !Number.isFinite(high)) return 0;
  if (high === low) return 100;
  const ratio = clamp((value - low) / (high - low), 0, 1);
  const normalized = direction === "lower_better" ? 1 - ratio : ratio;
  return round(normalized * 100);
}

export function calculateWeightedScore(factors: readonly ScoreFactorInput[]): number {
  if (!factors.length) return 0;
  const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
  if (totalWeight <= 0) {
    throw new Error("Decision scoring factors must have a positive total weight.");
  }
  const value = factors.reduce((sum, factor) => sum + (factor.normalizedScore * factor.weight), 0) / totalWeight;
  return clamp(round(value), 0, 100);
}

function resolveRawScore(
  factor: DecisionScoringOption["factors"][number],
  answers: Readonly<DecisionAnswers>,
  workflow: Readonly<DecisionWorkflow>,
  option: Readonly<DecisionScoringOption>,
): number | null {
  if (factor.evaluate) {
    const value = factor.evaluate(answers, workflow, option);
    if (value !== undefined && value !== null) return isFiniteNumber(value) ? value : null;
  }
  if (factor.questionId && answers[factor.questionId] !== undefined) {
    return coerceAnswerToNumber(answers[factor.questionId]);
  }
  return null;
}

function buildFactorBreakdown(
  option: DecisionScoringOption,
  answers: Readonly<DecisionAnswers>,
  workflow: Readonly<DecisionWorkflow>,
  missingAnswerScore: number,
): DecisionScoringFactorBreakdown[] {
  return option.factors.map((factor) => {
    const direction = factor.direction ?? "higher_better";
    const rawScore = resolveRawScore(factor, answers, workflow, option);
    const missing = rawScore === null || rawScore === undefined;
    const baseline = factor.min ?? 0;
    const ceiling = factor.max ?? 100;
    const normalizedScore = missing ? clamp(missingAnswerScore, 0, 100) : normalizeScore(rawScore, baseline, ceiling, direction);

    return {
      factorId: factor.id,
      label: factor.label,
      weight: factor.weight,
      rawScore,
      normalizedScore,
      direction,
      explanation: factor.explanation,
      contribution: 0,
      missing,
    };
  });
}

function addContributions(factors: DecisionScoringFactorBreakdown[]): DecisionScoringFactorBreakdown[] {
  const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
  if (totalWeight <= 0) {
    throw new Error("Decision scoring factors must have a positive total weight.");
  }
  return factors.map((factor) => ({
    ...factor,
    contribution: round((factor.normalizedScore * factor.weight) / totalWeight),
  }));
}

function buildStrengthsAndWeaknesses(factors: readonly DecisionScoringFactorBreakdown[]): { strengths: string[]; weaknesses: string[] } {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  for (const factor of factors) {
    const label = factor.explanation ?? factor.label;
    if (factor.missing) {
      weaknesses.push(`Missing ${label}`);
      continue;
    }
    if (factor.normalizedScore >= 70) strengths.push(label);
    else if (factor.normalizedScore <= 40) weaknesses.push(label);
  }
  return { strengths, weaknesses };
}

export function calculateConfidence(scores: readonly DecisionOptionScore[], answers: Readonly<DecisionAnswers>, workflow: Readonly<DecisionWorkflow>): number {
  if (!scores.length) return 0;
  const sortedScores = sortByScore(scores);
  const top = sortedScores[0];
  const second = sortedScores[1];
  const gapScore = second ? clamp((top.totalScore - second.totalScore) / 25, 0, 1) : 1;

  const scoringOptions = workflow.scoring?.options ?? [];
  const relevantQuestionIds = new Set<string>();
  for (const option of scoringOptions) {
    for (const questionId of getRelevantQuestionIds(option)) {
      relevantQuestionIds.add(questionId);
    }
  }
  const answeredRelevant = [...relevantQuestionIds].filter((questionId) => {
    const value = answers[questionId];
    return value !== undefined && value !== null && value !== "" && (!Array.isArray(value) || value.length > 0);
  }).length;
  const coverage = relevantQuestionIds.size ? answeredRelevant / relevantQuestionIds.size : 1;
  const factorCoverage = top.factors.length ? top.factors.filter((factor) => !factor.missing).length / top.factors.length : 1;

  return clamp(round((coverage * 0.45 + factorCoverage * 0.25 + gapScore * 0.3) * 100), 0, 100);
}

export function rankOptions(scores: readonly DecisionOptionScore[]): DecisionOptionScore[] {
  return sortByScore(scores);
}

export function calculateOptionScores(workflow: Readonly<DecisionWorkflow>, answers: Readonly<DecisionAnswers>): DecisionOptionScore[] {
  const scoring = workflow.scoring;
  if (!scoring?.options?.length) return [];

  const missingAnswerScore = scoring.missingAnswerScore ?? 50;
  const scores = scoring.options.map((option) => {
    const factors = addContributions(buildFactorBreakdown(option, answers, workflow, missingAnswerScore));
    const totalScore = calculateWeightedScore(factors);
    const { strengths, weaknesses } = buildStrengthsAndWeaknesses(factors);
    return {
      optionId: option.id,
      label: option.label,
      totalScore,
      confidence: 0,
      factors,
      strengths,
      weaknesses,
    } satisfies DecisionOptionScore;
  });

  const confidence = calculateConfidence(scores, answers, workflow);
  return scores.map((score) => ({ ...score, confidence }));
}

export class ScoringEngine {
  calculateOptionScores(workflow: Readonly<DecisionWorkflow>, answers: Readonly<DecisionAnswers>): DecisionOptionScore[] {
    return calculateOptionScores(workflow, answers);
  }

  calculateWeightedScore(factors: readonly ScoreFactorInput[]): number {
    return calculateWeightedScore(factors);
  }

  normalizeScore(value: number, min: number, max: number, direction: DecisionScoreDirection = "higher_better"): number {
    return normalizeScore(value, min, max, direction);
  }

  calculateConfidence(scores: readonly DecisionOptionScore[], answers: Readonly<DecisionAnswers>, workflow: Readonly<DecisionWorkflow>): number {
    return calculateConfidence(scores, answers, workflow);
  }

  rankOptions(scores: readonly DecisionOptionScore[]): DecisionOptionScore[] {
    return rankOptions(scores);
  }
}

export const scoringEngine = new ScoringEngine();
