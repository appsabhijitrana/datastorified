import { describe, expect, it } from "vitest";
import { evaluateCondition, evaluateRules } from "../core/ruleEngine";
import { workflow } from "./fixtures";

describe("rule engine", () => {
  it("evaluates declarative conditions and workflow rules", () => {
    expect(evaluateCondition({ fact: "quantity", operator: "between", value: [2, 5] }, { quantity: 4 })).toBe(true);
    expect(evaluateCondition({ fact: "labels", operator: "contains", value: "preferred" }, { labels: ["preferred", "available"] })).toBe(true);
    const evaluations = evaluateRules(workflow.rules, { workStyle: "team", experience: "low" });
    expect(evaluations.filter(({ matched }) => matched).map(({ rule }) => rule.id)).toEqual(["team-fit", "inexperienced"]);
  });
});
