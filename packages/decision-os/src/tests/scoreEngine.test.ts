import { describe, expect, it } from "vitest";
import { evaluateRules } from "../core/ruleEngine";
import { calculateDecisionScore } from "../core/scoreEngine";
import { workflow } from "./fixtures";

describe("score engine", () => {
  it("calculates normalized weighted factor scores", () => {
    const evaluations = evaluateRules(workflow.rules, { workStyle: "team", experience: "high" });
    const score = calculateDecisionScore(workflow.weights, evaluations, workflow.scoreBands);
    expect(score.value).toBe(74);
    expect(score.label).toBe("Viable fit");
    expect(score.factors).toEqual(expect.arrayContaining([
      expect.objectContaining({ factorId: "fit", score: 70, normalizedWeight: 0.6, contribution: 42 }),
      expect.objectContaining({ factorId: "readiness", score: 80, normalizedWeight: 0.4, contribution: 32 }),
    ]));
  });
});
