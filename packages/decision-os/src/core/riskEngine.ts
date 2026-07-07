import { clamp, round } from "../utils/math";
import { evaluateRules } from "./ruleEngine";
import type {
  DecisionAnswers,
  DecisionOptionScore,
  DecisionRisk,
  DecisionRiskAssessment,
  DecisionRiskFactorAssessment,
  DecisionRiskLevel,
  DecisionRuleEvaluation,
  DecisionWorkflow,
} from "../types";

const severityPoints: Record<DecisionRiskLevel, number> = {
  low: 15,
  medium: 35,
  high: 70,
};

function unique<T>(items: readonly T[]): T[] {
  return [...new Set(items)];
}

function normalizeRuleRisk(risk: DecisionRisk): DecisionRiskLevel {
  if (risk.severity === "critical") return "high";
  return risk.severity;
}

function scoreRiskSeverity(score: number): DecisionRiskLevel {
  if (score >= 70) return "high";
  if (score >= 35) return "medium";
  return "low";
}

function factorRiskContribution(normalizedScore: number, weight: number): number {
  const normalizedWeight = clamp(weight / 100, 0, 1);
  return round(clamp((100 - normalizedScore) * normalizedWeight, 0, 100));
}

function buildRuleRiskFactors(workflow: Readonly<DecisionWorkflow>, answers: Readonly<DecisionAnswers>): DecisionRiskFactorAssessment[] {
  const facts = { ...answers, ...(workflow.deriveFacts?.(answers) ?? {}) };
  const evaluations = evaluateRules(workflow.rules, facts);
  return evaluations
    .filter((evaluation) => evaluation.matched && evaluation.rule.risk)
    .map(({ rule }) => {
      const risk = rule.risk!;
      const severity = normalizeRuleRisk(risk);
      return {
        id: risk.id,
        label: risk.title,
        score: severityPoints[severity],
        severity,
        explanation: risk.description,
        mitigationTips: risk.mitigation ? [risk.mitigation] : [],
        source: "workflow-rule" as const,
      };
    });
}

function buildScoreFactorRiskFactors(score: Readonly<DecisionOptionScore>): DecisionRiskFactorAssessment[] {
  return score.factors.map((factor) => {
    const riskScore = factor.missing
      ? clamp(round(20 + factor.weight * 0.3), 15, 55)
      : factorRiskContribution(factor.normalizedScore, factor.weight);
    return {
      id: factor.factorId,
      label: factor.explanation ?? factor.label,
      score: riskScore,
      severity: scoreRiskSeverity(riskScore),
      explanation: factor.missing
        ? `Missing ${factor.label.toLowerCase()} increases uncertainty.`
        : `${factor.label} contributes ${factor.normalizedScore}% to the option score.`,
      mitigationTips: factor.missing ? [`Provide ${factor.label.toLowerCase()} to reduce uncertainty.`] : factor.normalizedScore <= 40 ? [`Strengthen ${factor.label.toLowerCase()} before proceeding.`] : [],
      source: factor.missing ? "missing-input" : "score-factor",
      optionId: score.optionId,
    };
  });
}

function buildUncertaintyRiskFactor(workflow: Readonly<DecisionWorkflow>, option: Readonly<DecisionOptionScore>): DecisionRiskFactorAssessment | null {
  if (option.confidence >= 70) return null;
  const score = clamp(round((70 - option.confidence) * 1.1), 10, 50);
  return {
    id: `${workflow.id}:${option.optionId}:uncertainty`,
    label: "Input uncertainty",
    score,
    severity: scoreRiskSeverity(score),
    explanation: `The option confidence is ${option.confidence}%, so some inputs remain uncertain.`,
    mitigationTips: ["Verify the most uncertain assumptions.", "Rerun the decision after filling missing information."],
    source: "uncertainty",
    optionId: option.optionId,
  };
}

export function classifyRisk(score: number): DecisionRiskLevel {
  if (score >= 70) return "high";
  if (score >= 35) return "medium";
  return "low";
}

export function calculateOverallRisk(riskFactors: readonly DecisionRiskFactorAssessment[]): { riskScore: number; riskLevel: DecisionRiskLevel } {
  if (!riskFactors.length) {
    return { riskScore: 0, riskLevel: "low" };
  }
  const total = riskFactors.reduce((sum, factor) => sum + factor.score, 0);
  const volumeBonus = clamp((riskFactors.length - 1) * 4, 0, 20);
  const riskScore = clamp(round(total + volumeBonus), 0, 100);
  return { riskScore, riskLevel: classifyRisk(riskScore) };
}

export function generateRiskExplanation(riskFactors: readonly DecisionRiskFactorAssessment[]): string {
  if (!riskFactors.length) {
    return "No material risks were identified from the current inputs.";
  }
  const topFactors = [...riskFactors]
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((factor) => factor.explanation);
  return topFactors.join(" ");
}

export function calculateRisk(
  workflow: Readonly<DecisionWorkflow>,
  optionId: string,
  answers: Readonly<DecisionAnswers>,
  score: Readonly<DecisionOptionScore>,
): DecisionRiskAssessment {
  const scoreOption = score.optionId === optionId ? score : { ...score, optionId };
  const uncertaintyFactor = buildUncertaintyRiskFactor(workflow, scoreOption);
  const riskFactors = [
    ...buildRuleRiskFactors(workflow, answers),
    ...buildScoreFactorRiskFactors(scoreOption),
    ...(uncertaintyFactor ? [uncertaintyFactor] : []),
  ];

  const deduped = riskFactors.reduce<DecisionRiskFactorAssessment[]>((list, factor) => {
    const existingIndex = list.findIndex((item) => item.id === factor.id && item.source === factor.source);
    if (existingIndex < 0) {
      list.push(factor);
      return list;
    }
    const existing = list[existingIndex];
    list[existingIndex] = {
      ...existing,
      score: Math.max(existing.score, factor.score),
      mitigationTips: unique([...existing.mitigationTips, ...factor.mitigationTips]),
      explanation: `${existing.explanation} ${factor.explanation}`.trim(),
    };
    return list;
  }, []);

  const { riskScore, riskLevel } = calculateOverallRisk(deduped);
  const explanation = generateRiskExplanation(deduped);
  const mitigationTips = unique(deduped.flatMap((factor) => factor.mitigationTips)).slice(0, 6);

  return {
    optionId,
    riskScore,
    riskLevel,
    riskFactors: deduped,
    explanation,
    mitigationTips,
  };
}

export class RiskEngine {
  calculateRisk(
    workflow: Readonly<DecisionWorkflow>,
    optionId: string,
    answers: Readonly<DecisionAnswers>,
    score: Readonly<DecisionOptionScore>,
  ): DecisionRiskAssessment {
    return calculateRisk(workflow, optionId, answers, score);
  }

  calculateOverallRisk(riskFactors: readonly DecisionRiskFactorAssessment[]): { riskScore: number; riskLevel: DecisionRiskLevel } {
    return calculateOverallRisk(riskFactors);
  }

  classifyRisk(score: number): DecisionRiskLevel {
    return classifyRisk(score);
  }

  generateRiskExplanation(riskFactors: readonly DecisionRiskFactorAssessment[]): string {
    return generateRiskExplanation(riskFactors);
  }
}

export const riskEngine = new RiskEngine();

const severityRank: Record<DecisionRisk["severity"], number> = { low: 1, medium: 2, high: 3, critical: 4 };

export function identifyRisks(evaluations: readonly DecisionRuleEvaluation[]): DecisionRisk[] {
  return evaluations
    .filter((evaluation) => evaluation.matched && evaluation.rule.risk)
    .map(({ rule }) => ({ ...rule.risk!, sourceRuleId: rule.id }))
    .sort((left, right) => severityRank[right.severity] - severityRank[left.severity]);
}
