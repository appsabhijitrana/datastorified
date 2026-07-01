import type { DecisionAnswers, DecisionConfig, DecisionQuestion } from "../types";
import { isQuestionVisible } from "./visibility";

export const getVisibleQuestions = (config: DecisionConfig, answers: DecisionAnswers) => config.questions.filter((question) => isQuestionVisible(question, answers));
const answered = (question: DecisionQuestion, answers: DecisionAnswers) => answers[question.id] !== undefined && answers[question.id] !== "";
export const getNextQuestion = (config: DecisionConfig, answers: DecisionAnswers) => getVisibleQuestions(config, answers).find((question) => question.required !== false && !answered(question, answers));
export const getProgress = (config: DecisionConfig, answers: DecisionAnswers) => {
  const required = getVisibleQuestions(config, answers).filter((question) => question.required !== false);
  return required.length ? Math.round(required.filter((question) => answered(question, answers)).length / required.length * 100) : 100;
};
export function validateAnswers(config: DecisionConfig, answers: DecisionAnswers): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const question of getVisibleQuestions(config, answers)) {
    const value = answers[question.id];
    if (question.required !== false && (value === undefined || value === "")) { errors[question.id] = `${question.label} is required.`; continue; }
    if (typeof value === "number" && question.min !== undefined && value < question.min) errors[question.id] = `${question.label} must be at least ${question.min}.`;
    if (typeof value === "number" && question.max !== undefined && value > question.max) errors[question.id] = `${question.label} must be no more than ${question.max}.`;
  }
  return errors;
}
export const defaultAnswers = (config: DecisionConfig): DecisionAnswers => Object.fromEntries(config.questions.filter((question) => question.defaultValue !== undefined).map((question) => [question.id, question.defaultValue]));
