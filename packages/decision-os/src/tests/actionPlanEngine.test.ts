import { describe, expect, it } from "vitest";
import { generateActionPlan, generateFollowUpActions, generateRiskMitigationActions, prioritizeActions } from "../core/actionPlanEngine";
import type { DecisionActionPlanResult, DecisionRecommendationResult, DecisionRiskAssessment, DecisionWorkflow } from "../types";

const workflow: DecisionWorkflow = {
  id: "action-plan-workflow",
  slug: "action-plan-workflow",
  pluginId: "test-plugin",
  version: "1.0.0",
  title: "Action plan workflow",
  category: "career",
  description: "A workflow for testing action plans.",
  intent: {
    keywords: ["action", "plan"],
    aliases: ["action plan workflow"],
    examples: ["test action plan"],
  },
  questions: [
    { id: "stability", prompt: "Stability", type: "number", required: true, helperText: "Rate stability" },
    { id: "speed", prompt: "Speed", type: "number", required: true, helperText: "Rate speed" },
    { id: "bonus", prompt: "Bonus", type: "boolean", required: false, helperText: "Optional detail" },
  ],
  rules: [],
  weights: [],
  recommendations: [
    { id: "caution", minScore: 0, maxScore: 59.99, title: "Caution", summary: "The choice needs more work.", actions: ["Reduce the biggest risk", "Recheck assumptions"] },
    { id: "proceed", minScore: 60, maxScore: 100, title: "Proceed", summary: "The choice is broadly supported.", actions: ["Validate assumptions", "Move forward carefully"] },
  ],
  actionPlanTemplates: [
    {
      id: "caution-plan",
      minScore: 0,
      maxScore: 59.99,
      actions: ["Close the biggest gap", "Create a backup plan"],
    },
    {
      id: "proceed-plan",
      minScore: 60,
      maxScore: 100,
      actions: ["Set a start date", "Review dependencies"],
    },
  ],
};

const recommendation: DecisionRecommendationResult = {
  winnerOptionId: "proceed",
  summary: "The choice is broadly supported.",
  confidence: 84,
  whyThisWins: ["Strongest inputs: Stability."],
  tradeOffs: ["Some trade-offs remain."],
  bestFor: ["Best for structured decisions."],
  avoidIf: ["Avoid if risk tolerance is very low."],
  alternativeOptions: [
    {
      optionId: "caution",
      label: "Caution option",
      totalScore: 62,
      confidence: 72,
      riskScore: 22,
      riskLevel: "medium",
      adjustedScore: 58,
      strengths: ["Flexibility"],
      weaknesses: ["Stability"],
      whyNotWinner: "The chosen option is stronger after weighing risk and confidence.",
      tradeOffs: ["It is slightly less flexible."],
    },
  ],
  disclaimerNote: "Deterministic recommendation only.",
};

function risk(optionId: string, level: DecisionRiskAssessment["riskLevel"], tips: string[] = []): DecisionRiskAssessment {
  return {
    optionId,
    riskScore: level === "high" ? 80 : level === "medium" ? 45 : 10,
    riskLevel: level,
    riskFactors: [],
    explanation: `${level} risk`,
    mitigationTips: tips,
  };
}

describe("Decision action plan engine", () => {
  it("generates a practical action plan", () => {
    const result = generateActionPlan(workflow, { stability: 8, speed: 4 }, recommendation, [risk("proceed", "medium", ["Reduce exposure"])]);

    expect(result.title).toBe("Action plan workflow action plan");
    expect(result.summary).toBe(recommendation.summary);
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.priority).toBe("medium");
    expect(result.estimatedEffort.toLowerCase()).toContain("effort");
    expect(result.recommendedTimeline).toContain("week");
    expect(result.followUpQuestions.length).toBeGreaterThan(0);
  });

  it("prioritizes high-priority actions first", () => {
    const ordered = prioritizeActions([
      { text: "Low priority task", source: "workflow", priority: 10, effort: 3, timeline: 3 },
      { text: "High priority task", source: "risk", priority: 90, effort: 1, timeline: 1 },
      { text: "Medium priority task", source: "follow-up", priority: 50, effort: 2, timeline: 2 },
    ]);

    expect(ordered.map((action) => action.text)).toEqual(["High priority task", "Medium priority task", "Low priority task"]);
  });

  it("creates risk mitigation steps", () => {
    const mitigations = generateRiskMitigationActions([
      risk("one", "high", ["Build a buffer", "Verify terms"]),
      risk("two", "medium"),
    ]);

    expect(mitigations.join(" ")).toContain("Build a buffer");
    expect(mitigations.join(" ")).toContain("address medium risk factors");
  });

  it("generates follow-up actions from the recommendation", () => {
    const followUps = generateFollowUpActions(workflow, recommendation);

    expect(followUps.length).toBeGreaterThan(0);
    expect(followUps[0]).toContain("Review");
  });

  it("handles empty risk cases cleanly", () => {
    const result = generateActionPlan(workflow, { stability: 8, speed: 4, bonus: true }, recommendation, []);

    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.priority).toBe("low");
    expect(result.followUpQuestions.some((question) => question.includes("stability"))).toBe(true);
  });

  it("returns a typed action plan result", () => {
    const result: DecisionActionPlanResult = generateActionPlan(workflow, { stability: 8, speed: 4 }, recommendation, []);
    expect(result.steps).toBeDefined();
  });
});
