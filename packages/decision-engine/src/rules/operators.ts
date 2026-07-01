import type { AnswerValue, Operator } from "../types";

export function compare(actual: AnswerValue | undefined, operator: Operator, expected?: AnswerValue | [number, number]): boolean {
  if (operator === "exists") return actual !== undefined && actual !== "";
  if (operator === "not_exists") return actual === undefined || actual === "";
  if (operator === "equals") return actual === expected;
  if (operator === "not_equals") return actual !== expected;
  if (typeof actual !== "number") return false;
  if (operator === "between" || operator === "not_between") {
    if (!Array.isArray(expected)) return false;
    const inside = actual >= expected[0] && actual <= expected[1];
    return operator === "between" ? inside : !inside;
  }
  if (typeof expected !== "number") return false;
  if (operator === "greater_than") return actual > expected;
  if (operator === "less_than") return actual < expected;
  if (operator === "greater_than_or_equal") return actual >= expected;
  if (operator === "less_than_or_equal") return actual <= expected;
  return false;
}
