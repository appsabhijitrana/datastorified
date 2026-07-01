import { evaluateConditionGroup } from "./ruleEngine";
import type { DecisionAnswers, DecisionFacts, DecisionQuestion, DecisionValue } from "../types";

export function isQuestionVisible(question: DecisionQuestion, answers: DecisionAnswers, facts: DecisionFacts = {}): boolean {
  return evaluateConditionGroup(question.visibleWhen, { ...answers, ...facts });
}

export function getVisibleQuestions(questions: readonly DecisionQuestion[], answers: DecisionAnswers, facts: DecisionFacts = {}): DecisionQuestion[] {
  return questions.filter((question) => isQuestionVisible(question, answers, facts));
}

export function createDefaultAnswers(questions: readonly DecisionQuestion[]): DecisionAnswers {
  return Object.fromEntries(questions.filter((question) => question.defaultValue !== undefined).map((question) => [question.id, question.defaultValue]));
}

function hasValue(value: DecisionValue | undefined): boolean {
  return value !== undefined && value !== null && value !== "" && (!Array.isArray(value) || value.length > 0);
}

export function validateAnswers(questions: readonly DecisionQuestion[], answers: DecisionAnswers, facts: DecisionFacts = {}): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const question of getVisibleQuestions(questions, answers, facts)) {
    const value = answers[question.id];
    if (question.required && !hasValue(value)) {
      errors[question.id] = question.validation?.message ?? "This answer is required.";
      continue;
    }
    if (!hasValue(value)) continue;
    const validation = question.validation;
    if (!validation) continue;
    if (typeof value === "number" && validation.min !== undefined && value < validation.min) errors[question.id] = validation.message ?? `Value must be at least ${validation.min}.`;
    else if (typeof value === "number" && validation.max !== undefined && value > validation.max) errors[question.id] = validation.message ?? `Value must be at most ${validation.max}.`;
    else if (typeof value === "string" && validation.minLength !== undefined && value.length < validation.minLength) errors[question.id] = validation.message ?? `Answer must contain at least ${validation.minLength} characters.`;
    else if (typeof value === "string" && validation.maxLength !== undefined && value.length > validation.maxLength) errors[question.id] = validation.message ?? `Answer must contain at most ${validation.maxLength} characters.`;
    else if (typeof value === "string" && validation.pattern && !new RegExp(validation.pattern, "u").test(value)) errors[question.id] = validation.message ?? "Answer is not in the expected format.";
  }
  return errors;
}
