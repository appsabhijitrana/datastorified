import type { ProfileAnalysis, ProfileFieldSuggestion } from "@datastorified/profile";

export type ConfidenceBand = "low" | "medium" | "high";

export type DecisionConfidenceCalculatorInput = {
  answerProgress?: { answered: number; total: number; requiredAnswered?: number; requiredTotal?: number };
  requiredAnswersCompleted?: number;
  requiredAnswersTotal?: number;
  optionalAnswersCompleted?: number;
  optionalAnswersTotal?: number;
  relevantProfileFields?: number;
  relevantProfileFieldsAvailable?: number;
  assumptionQuality?: number;
  workflowSignals?: number;
  decisionSignals?: number;
  assumptions?: string[];
  profileAnalysis?: Pick<ProfileAnalysis, "percentage" | "nextBestField" | "description">;
};

export type DecisionConfidenceResult = {
  currentConfidence: number;
  score: number;
  confidenceBand: ConfidenceBand;
  profileCompleteness: number;
  missingSignals: string[];
  profileAnalysis?: Pick<ProfileAnalysis, "percentage" | "nextBestField" | "description">;
  impactPreview?: {
    field?: ProfileFieldSuggestion;
    from: number;
    to: number;
    label: string;
  };
};

export function calculateDecisionConfidence(input: DecisionConfidenceCalculatorInput): DecisionConfidenceResult {
  const requiredAnswered = input.answerProgress?.requiredAnswered ?? input.requiredAnswersCompleted ?? 0;
  const requiredTotal = input.answerProgress?.requiredTotal ?? input.requiredAnswersTotal ?? input.answerProgress?.total ?? 0;
  const required = ratio(requiredAnswered, requiredTotal);
  const optional = ratio(input.optionalAnswersCompleted ?? 0, input.optionalAnswersTotal ?? 0);
  const profile = clamp(input.profileAnalysis?.percentage ?? 0, 0, 100);
  const relevant = ratio(input.relevantProfileFieldsAvailable ?? 0, input.relevantProfileFields ?? 0);
  const assumptions = clamp(input.assumptionQuality ?? 55, 0, 100);
  const signals = clamp((input.workflowSignals ?? input.decisionSignals ?? 0) * 12, 0, 100);

  const currentConfidence = Math.round(
    clamp((required * 0.36) + (optional * 0.14) + (profile * 0.2) + (relevant * 0.16) + (assumptions * 0.08) + (signals * 0.06), 0, 100),
  );
  const band = currentConfidence >= 75 ? "high" : currentConfidence >= 45 ? "medium" : "low";
  const nextField = input.profileAnalysis?.nextBestField;
  const impact = nextField ? estimateImpact(currentConfidence, profile, relevant) : currentConfidence;

  return {
    currentConfidence: roundToBand(currentConfidence),
    score: roundToBand(currentConfidence),
    confidenceBand: band,
    profileCompleteness: Math.round(profile),
    missingSignals: buildMissingSignals(input),
    profileAnalysis: input.profileAnalysis,
    impactPreview: nextField ? { field: nextField, from: roundToBand(currentConfidence), to: roundToBand(impact), label: nextField.label } : undefined,
  };
}

export function ProfileCompletionScore({ value }: { value: number }) {
  return `${Math.round(clamp(value, 0, 100))}%`;
}

export function ConfidenceImpactPreview({ from, to, label }: { from: number; to: number; label: string }) {
  return `${label}: ${roundToBand(from)}% -> ${roundToBand(to)}%`;
}

export function MissingSignalList({ signals }: { signals: string[] }) {
  return signals.length ? signals : ["No major gaps right now."];
}

export function ProfileCompletenessRing({ value }: { value: number }) {
  const pct = clamp(value, 0, 100);
  const stroke = 2 * Math.PI * 18;
  const offset = stroke - (stroke * pct) / 100;
  return { value: Math.round(pct), stroke, offset };
}

function buildMissingSignals(input: DecisionConfidenceCalculatorInput): string[] {
  const signals: string[] = [];
  const requiredAnswered = input.answerProgress?.requiredAnswered ?? input.requiredAnswersCompleted ?? 0;
  const requiredTotal = input.answerProgress?.requiredTotal ?? input.requiredAnswersTotal ?? input.answerProgress?.total ?? 0;
  if (requiredAnswered < requiredTotal) signals.push("Finish required answers");
  if ((input.optionalAnswersCompleted ?? 0) < (input.optionalAnswersTotal ?? 0)) signals.push("Optional answers can refine the preview");
  if ((input.profileAnalysis?.nextBestField?.label ?? "").trim()) signals.push(`Add ${input.profileAnalysis?.nextBestField?.label.toLowerCase() ?? "one detail"}`);
  if ((input.workflowSignals ?? input.decisionSignals ?? 0) < 2) signals.push("More workflow-specific signals can improve confidence");
  if ((input.assumptionQuality ?? 55) < 60 || (input.assumptions?.length ?? 0) > 0) signals.push("Review assumptions");
  if ((input.answerProgress?.answered ?? 0) < (input.answerProgress?.total ?? 0)) signals.push("Continue answering to sharpen the preview");
  return signals;
}

function estimateImpact(current: number, profile: number, relevant: number) {
  return clamp(current + Math.max(4, Math.round((100 - profile) * 0.08 + (100 - relevant) * 0.05)), 0, 100);
}

function ratio(completed: number, total: number) {
  if (total <= 0) return 0;
  return clamp((completed / total) * 100, 0, 100);
}

function roundToBand(value: number) {
  if (value < 10) return 10;
  if (value > 95) return 95;
  return Math.round(value / 5) * 5;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
