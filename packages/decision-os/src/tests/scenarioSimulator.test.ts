import { describe, expect, it } from "vitest";
import {
  compareBeforeAfter,
  detectRecommendationChange,
  generateSimulationExplanation,
  simulateChange,
  simulateMultipleChanges,
} from "../core/scenarioSimulator";
import type { DecisionSession } from "../core/foundation";
import type { DecisionWorkflow } from "../types";

const workflow: DecisionWorkflow = {
  id: "simulation-workflow",
  slug: "simulation-workflow",
  pluginId: "test-plugin",
  version: "1.0.0",
  title: "Simulation workflow",
  category: "career",
  description: "A workflow for exercising the scenario simulator.",
  intent: {
    keywords: ["simulation", "scenario"],
    aliases: ["simulation workflow"],
    examples: ["simulate a scenario"],
  },
  questions: [
    { id: "stability", prompt: "Stability", type: "number", required: true },
    { id: "speed", prompt: "Speed", type: "number", required: true },
  ],
  rules: [
    {
      id: "speed-pressure",
      description: "High speed pressure raises risk.",
      when: { all: [{ fact: "speed", operator: "greater-than", value: 8 }] },
      risk: {
        id: "speed-risk",
        title: "Speed pressure",
        description: "Fast changes can increase uncertainty.",
        severity: "high",
        mitigation: "Slow down and validate assumptions.",
      },
    },
  ],
  weights: [],
  recommendations: [
    { id: "caution", minScore: 0, maxScore: 59.99, title: "Caution", summary: "The choice needs more work.", actions: ["Improve the weak spots"] },
    { id: "proceed", minScore: 60, maxScore: 100, title: "Proceed", summary: "The choice is broadly supported.", actions: ["Validate assumptions", "Move forward carefully"] },
  ],
  scoring: {
    missingAnswerScore: 50,
    options: [
      {
        id: "safe",
        label: "Safe option",
        factors: [
          { id: "stability", label: "Stability", weight: 80, questionId: "stability", min: 0, max: 10, direction: "higher_better", explanation: "Stable inputs support this choice." },
          { id: "speed", label: "Speed", weight: 20, questionId: "speed", min: 0, max: 10, direction: "lower_better", explanation: "Lower speed pressure favors this choice." },
        ],
      },
      {
        id: "fast",
        label: "Fast option",
        factors: [
          { id: "stability", label: "Stability", weight: 20, questionId: "stability", min: 0, max: 10, direction: "higher_better", explanation: "Stable inputs support this choice." },
          { id: "speed", label: "Speed", weight: 80, questionId: "speed", min: 0, max: 10, direction: "higher_better", explanation: "Higher speed favors this choice." },
        ],
      },
    ],
  },
};

function buildSession(): DecisionSession & { workflow: DecisionWorkflow } {
  return {
    id: "session-1",
    workflowId: workflow.id,
    pluginId: workflow.pluginId,
    status: "draft",
    answers: { stability: 4, speed: 2 },
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    workflow,
  };
}

describe("ScenarioSimulator", () => {
  it("simulates a single input change", () => {
    const session = buildSession();
    const result = simulateChange(session, { questionId: "speed", value: 9 });

    expect(result.changedInputs).toHaveLength(1);
    expect(result.beforeWinner).toBe("safe");
    expect(result.afterWinner).toBe("fast");
    expect(result.recommendationChanged).toBe(true);
    expect(result.afterScore).toBeGreaterThan(result.beforeScore);
  });

  it("simulates multiple input changes", () => {
    const session = buildSession();
    const result = simulateMultipleChanges(session, [
      { questionId: "stability", value: 8 },
      { questionId: "speed", value: 9 },
    ]);

    expect(result.changedInputs).toHaveLength(2);
    expect(result.afterWinner).toBe("fast");
    expect(result.afterScore).toBeGreaterThan(result.beforeScore);
  });

  it("detects winner change and score delta", () => {
    const session = buildSession();
    const result = simulateChange(session, { questionId: "speed", value: 9 });

    expect(result.scoreDelta).toBeGreaterThan(0);
    expect(result.beforeWinner).not.toBe(result.afterWinner);
    expect(detectRecommendationChange(result.beforeResult, result.afterResult)).toBe(true);
    expect(compareBeforeAfter(result.beforeResult, result.afterResult).scoreDelta).toBe(result.scoreDelta);
  });

  it("does not mutate the original session", () => {
    const session = buildSession();
    const originalAnswers = { ...session.answers };

    simulateChange(session, { questionId: "speed", value: 9 });

    expect(session.answers).toEqual(originalAnswers);
    expect(session.answers.speed).toBe(2);
  });

  it("generates a readable explanation", () => {
    const session = buildSession();
    const result = simulateChange(session, { questionId: "speed", value: 9 });

    const explanation = generateSimulationExplanation(result.beforeResult, result.afterResult, result.changedInputs);
    expect(explanation).toContain("speed");
    expect(explanation).toContain("winner changed");
  });
});
