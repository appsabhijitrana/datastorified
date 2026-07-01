import { calculate, type CalculationResult } from "@datastorified/calculators-engine";
import type {
  DecisionActionPlanTemplate,
  DecisionAnswers,
  DecisionQuestion,
  DecisionRecommendation,
  DecisionRisk,
  DecisionValue,
} from "../types";

type Option = [label: string, value: DecisionValue];

const numericQuestion = (
  id: string,
  prompt: string,
  type: "currency" | "percentage" | "number" | "slider" | "duration",
  defaultValue: number,
  min: number,
  max: number,
  helperText: string,
  step = 1,
  unit?: string,
): DecisionQuestion => ({ id, prompt, type, defaultValue, required: true, helperText, step, unit, validation: { min, max } });

export const currencyQuestion = (id: string, prompt: string, value: number, helper: string, max = 1_000_000_000) => numericQuestion(id, prompt, "currency", value, 0, max, helper, 1_000, "INR");
export const percentageQuestion = (id: string, prompt: string, value: number, helper: string, max = 100) => numericQuestion(id, prompt, "percentage", value, 0, max, helper, 0.1, "%");
export const numberQuestion = (id: string, prompt: string, value: number, min: number, max: number, helper: string) => numericQuestion(id, prompt, "number", value, min, max, helper);
export const sliderQuestion = (id: string, prompt: string, value: number, min: number, max: number, helper: string) => numericQuestion(id, prompt, "slider", value, min, max, helper);
export const durationQuestion = (id: string, prompt: string, value: number, min: number, max: number, helper: string) => numericQuestion(id, prompt, "duration", value, min, max, helper, 1, "years");
export const selectQuestion = (id: string, prompt: string, value: DecisionValue, options: Option[], helper: string): DecisionQuestion => ({ id, prompt, type: "select", defaultValue: value, required: true, helperText: helper, options: options.map(([label, optionValue]) => ({ label, value: optionValue })) });
export const booleanQuestion = (id: string, prompt: string, value: boolean, helper: string): DecisionQuestion => ({ id, prompt, type: "boolean", defaultValue: value, required: true, helperText: helper });
export const textQuestion = (id: string, prompt: string, helper: string): DecisionQuestion => ({ id, prompt, type: "text", defaultValue: "", required: false, helperText: helper, validation: { maxLength: 500 } });

export function numberAnswer(answers: Readonly<DecisionAnswers>, key: string, fallback = 0): number {
  return typeof answers[key] === "number" ? answers[key] : fallback;
}

export function booleanAnswer(answers: Readonly<DecisionAnswers>, key: string): boolean {
  return answers[key] === true;
}

export function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

export function calculatorValue(slug: string, inputs: Record<string, number>): number {
  const result = calculatorResult(slug, inputs);
  return result.error ? 0 : result.primaryResult.value;
}

export function calculatorResult(slug: string, inputs: Record<string, number>): CalculationResult {
  return calculate(slug, inputs);
}

export const standardScoreBands = [
  { min: 0, max: 39.99, label: "High caution" },
  { min: 40, max: 64.99, label: "Conditional" },
  { min: 65, max: 100, label: "Supportive" },
];

export function recommendationTemplates(subject: string): DecisionRecommendation[] {
  return [
    { id: "pause", minScore: 0, maxScore: 39.99, title: `Pause before you ${subject}`, summary: "Material risks or missing safeguards weaken the decision under the current assumptions.", actions: ["Address the highest-severity risk", "Rerun the decision with verified inputs"] },
    { id: "conditional", minScore: 40, maxScore: 64.99, title: `Proceed conditionally with ${subject}`, summary: "The decision may work, but important assumptions or safeguards still need validation.", actions: ["Validate the most sensitive assumption", "Choose a reversible next step"] },
    { id: "supportive", minScore: 65, maxScore: 100, title: `The case is supportive for ${subject}`, summary: "The current inputs support the decision, subject to the listed risks and assumptions.", actions: ["Confirm external terms in writing", "Set a date to review the outcome"] },
  ];
}

export function actionPlanTemplates(subject: string): DecisionActionPlanTemplate[] {
  return [
    { id: "stabilise", minScore: 0, maxScore: 39.99, actions: ["Do not commit yet", "Close the largest safety gap", "Collect current quotes or evidence", "Rerun the analysis"] },
    { id: "validate", minScore: 40, maxScore: 64.99, actions: ["List the assumptions that could change the answer", "Validate the top two assumptions", `Test a smaller or reversible version of ${subject}`, "Set a decision deadline"] },
    { id: "execute", minScore: 65, maxScore: 100, actions: ["Confirm all material terms", `Create an execution checklist for ${subject}`, "Keep the recommended safety buffer", "Schedule a post-decision review"] },
  ];
}

export const risk = (id: string, title: string, description: string, severity: DecisionRisk["severity"], mitigation: string): Omit<DecisionRisk, "sourceRuleId"> => ({ id, title, description, severity, mitigation });
