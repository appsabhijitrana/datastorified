import { describe, expect, it } from "vitest";
import { calculateOptionScores } from "../core/scoringEngine";
import { calculateOverallRisk, calculateRisk, classifyRisk, generateRiskExplanation } from "../core/riskEngine";
import type { DecisionWorkflow } from "../types";

const workflow: DecisionWorkflow = {
  id: "risk-workflow",
  slug: "risk-workflow",
  pluginId: "test-plugin",
  version: "1.0.0",
  title: "Risk workflow",
  category: "career",
  description: "A workflow to exercise risk scoring.",
  intent: {
    keywords: ["risk", "test"],
    aliases: ["risk workflow"],
    examples: ["test risk"],
  },
  questions: [
    { id: "stability", prompt: "Stability", type: "number", required: true },
    { id: "certainty", prompt: "Certainty", type: "number", required: true },
  ],
  rules: [
    {
      id: "low-stability",
      description: "Very low stability increases risk.",
      when: { all: [{ fact: "stability", operator: "less-than-or-equal", value: 2 }] },
      risk: {
        id: "unstable",
        title: "Unstable inputs",
        description: "The option depends on a weak base condition.",
        severity: "high",
        mitigation: "Improve stability before committing.",
      },
    },
    {
      id: "low-certainty",
      description: "Low certainty increases uncertainty.",
      when: { all: [{ fact: "certainty", operator: "less-than", value: 5 }] },
      risk: {
        id: "uncertain",
        title: "Uncertain assumptions",
        description: "Important inputs remain unverified.",
        severity: "medium",
        mitigation: "Verify the uncertain inputs first.",
      },
    },
  ],
  weights: [],
  recommendations: [
    { id: "default", minScore: 0, maxScore: 100, title: "Default", summary: "Generic", actions: ["Review inputs"] },
  ],
  scoring: {
    missingAnswerScore: 50,
    options: [
      {
        id: "proceed",
        label: "Proceed",
        factors: [
          { id: "stability-fit", label: "Stability fit", weight: 70, questionId: "stability", min: 0, max: 10, direction: "higher_better", explanation: "Stable inputs reduce risk." },
          { id: "certainty-fit", label: "Certainty fit", weight: 30, questionId: "certainty", min: 0, max: 10, direction: "higher_better", explanation: "Higher certainty reduces uncertainty." },
        ],
      },
      {
        id: "wait",
        label: "Wait",
        factors: [
          { id: "stability-fit", label: "Stability fit", weight: 70, questionId: "stability", min: 0, max: 10, direction: "lower_better", explanation: "Waiting can help when stability is low." },
          { id: "certainty-fit", label: "Certainty fit", weight: 30, questionId: "certainty", min: 0, max: 10, direction: "lower_better", explanation: "Waiting can help when certainty is low." },
        ],
      },
    ],
  },
};

describe("Decision risk engine", () => {
  it("classifies low risk", () => {
    expect(classifyRisk(10)).toBe("low");
    expect(classifyRisk(50)).toBe("medium");
    expect(classifyRisk(80)).toBe("high");
  });

  it("calculates low risk for strong inputs", () => {
    const score = calculateOptionScores(workflow, { stability: 10, certainty: 10 }).find((item) => item.optionId === "proceed");
    const result = calculateRisk(workflow, "proceed", { stability: 10, certainty: 10 }, score!);

    expect(result.riskLevel).toBe("low");
    expect(result.riskScore).toBeLessThan(35);
    expect(result.riskFactors.length).toBeGreaterThan(0);
  });

  it("calculates medium risk for mixed inputs", () => {
    const score = calculateOptionScores(workflow, { stability: 4, certainty: 6 }).find((item) => item.optionId === "proceed");
    const result = calculateRisk(workflow, "proceed", { stability: 4, certainty: 6 }, score!);

    expect(result.riskLevel).toBe("medium");
    expect(result.riskScore).toBeGreaterThanOrEqual(35);
    expect(result.riskScore).toBeLessThan(70);
  });

  it("calculates high risk when workflow rules and weak inputs align", () => {
    const score = calculateOptionScores(workflow, { stability: 1, certainty: 1 }).find((item) => item.optionId === "proceed");
    const result = calculateRisk(workflow, "proceed", { stability: 1, certainty: 1 }, score!);

    expect(result.riskLevel).toBe("high");
    expect(result.riskScore).toBeGreaterThanOrEqual(70);
    expect(result.riskFactors.some((factor) => factor.source === "workflow-rule")).toBe(true);
  });

  it("combines multiple risk factors and surfaces mitigation tips", () => {
    const score = calculateOptionScores(workflow, { stability: 1, certainty: 4 }).find((item) => item.optionId === "proceed");
    const result = calculateRisk(workflow, "proceed", { stability: 1, certainty: 4 }, score!);

    expect(result.riskFactors.length).toBeGreaterThan(2);
    expect(result.mitigationTips.length).toBeGreaterThan(0);
    expect(generateRiskExplanation(result.riskFactors)).toContain("The option depends on a weak base condition.");
  });

  it("increases uncertainty when answers are missing", () => {
    const complete = calculateOptionScores(workflow, { stability: 8, certainty: 8 }).find((item) => item.optionId === "proceed");
    const partial = calculateOptionScores(workflow, { stability: 8 }).find((item) => item.optionId === "proceed");
    const completeRisk = calculateRisk(workflow, "proceed", { stability: 8, certainty: 8 }, complete!);
    const partialRisk = calculateRisk(workflow, "proceed", { stability: 8 }, partial!);

    expect(partialRisk.riskScore).toBeGreaterThan(completeRisk.riskScore);
    expect(partialRisk.riskFactors.some((factor) => factor.source === "missing-input" || factor.source === "uncertainty")).toBe(true);
  });

  it("aggregates risk factors into an overall risk score", () => {
    const overall = calculateOverallRisk([
      { id: "one", label: "One", score: 20, severity: "low", explanation: "One", mitigationTips: [], source: "score-factor" },
      { id: "two", label: "Two", score: 30, severity: "medium", explanation: "Two", mitigationTips: [], source: "score-factor" },
    ]);

    expect(overall.riskScore).toBeGreaterThan(35);
    expect(overall.riskLevel).toBe("medium");
  });
});
