import type {
  DecisionCondition,
  DecisionConditionGroup,
  DecisionFacts,
  DecisionRule,
  DecisionRuleEvaluation,
  DecisionScalar,
  DecisionValue,
} from "../types";

function isPresent(value: DecisionValue | undefined): boolean {
  return value !== undefined && value !== null && value !== "";
}

function includesScalar(values: readonly DecisionScalar[], candidate: DecisionValue | undefined): boolean {
  return candidate !== undefined && !Array.isArray(candidate) && values.some((value) => value === candidate);
}

export function evaluateCondition(condition: DecisionCondition, facts: DecisionFacts): boolean {
  const actual = facts[condition.fact];
  const expected = condition.value;

  switch (condition.operator) {
    case "exists": return isPresent(actual);
    case "not-exists": return !isPresent(actual);
    case "equals": return actual === expected;
    case "not-equals": return actual !== expected;
    case "greater-than": return typeof actual === "number" && typeof expected === "number" && actual > expected;
    case "greater-than-or-equal": return typeof actual === "number" && typeof expected === "number" && actual >= expected;
    case "less-than": return typeof actual === "number" && typeof expected === "number" && actual < expected;
    case "less-than-or-equal": return typeof actual === "number" && typeof expected === "number" && actual <= expected;
    case "between": return typeof actual === "number" && Array.isArray(expected) && expected.length === 2 && typeof expected[0] === "number" && typeof expected[1] === "number" && actual >= expected[0] && actual <= expected[1];
    case "contains":
      if (typeof actual === "string" && typeof expected === "string") return actual.includes(expected);
      return Array.isArray(actual) && includesScalar(actual, expected);
    case "in": return Array.isArray(expected) && includesScalar(expected, actual);
    default: return false;
  }
}

export function evaluateConditionGroup(group: DecisionConditionGroup | undefined, facts: DecisionFacts): boolean {
  if (!group) return true;
  const allMatch = !group.all || group.all.every((condition) => evaluateCondition(condition, facts));
  const anyMatch = !group.any || group.any.length === 0 || group.any.some((condition) => evaluateCondition(condition, facts));
  return allMatch && anyMatch;
}

export function evaluateRules(rules: readonly DecisionRule[], facts: DecisionFacts): DecisionRuleEvaluation[] {
  return rules.map((rule) => ({ rule, matched: evaluateConditionGroup(rule.when, facts) }));
}
