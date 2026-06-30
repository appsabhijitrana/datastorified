import type { AnswerValue, DecisionQuestion } from "../types";
export const formatAnswer = (question: DecisionQuestion, value: AnswerValue) => {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number" && question.type === "currency") return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
  if (typeof value === "number" && question.type === "percentage") return `${value}%`;
  if (typeof value === "number" && question.type === "duration") return `${value} years`;
  return String(question.options?.find((option) => option.value === value)?.label ?? value);
};
