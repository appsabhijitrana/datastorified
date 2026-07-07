import { describe, expect, it } from "vitest";
import { calculateRisk } from "../core/riskEngine";
import { calculateOptionScores } from "../core/scoringEngine";
import {
  generateAvoidIf,
  generateBestFor,
  generateRecommendation,
  generateTradeOffs,
  generateWhyThisWins,
  selectWinner,
} from "../core/recommendationEngine";
import type { DecisionOptionScore, DecisionWorkflow } from "../types";

const workflow: DecisionWorkflow = {
  id: "recommendation-workflow",
  slug: "recommendation-workflow",
  pluginId: "test-plugin",
  version: "1.0.0",
  title: "Recommendation workflow",
  category: "career",
  description: "A workflow for testing recommendations.",
  intent: {
    keywords: ["recommendation", "test"],
    aliases: ["recommendation workflow"],
    examples: ["test recommendation"],
  },
  questions: [
    { id: "stability", prompt: "Stability", type: "number", required: true },
    { id: "speed", prompt: "Speed", type: "number", required: true },
  ],
  rules: [],
  weights: [],
  recommendations: [
    { id: "caution", minScore: 0, maxScore: 59.99, title: "Caution", summary: "The choice needs more work.", actions: ["Improve the weak spots"] },
    { id: "proceed", minScore: 60, maxScore: 100, title: "Proceed", summary: "The choice is broadly supported.", actions: ["Validate assumptions", "Move forward thoughtfully"] },
  ],
  scoring: {
    missingAnswerScore: 50,
    options: [
      {
        id: "safe",
        label: "Safe option",
        factors: [
          { id: "stability", label: "Stability", weight: 70, questionId: "stability", min: 0, max: 10, direction: "higher_better", explanation: "Stable inputs support this choice." },
          { id: "speed", label: "Speed", weight: 30, questionId: "speed", min: 0, max: 10, direction: "lower_better", explanation: "Lower speed pressure favors this choice." },
        ],
      },
      {
        id: "fast",
        label: "Fast option",
        factors: [
          { id: "stability", label: "Stability", weight: 70, questionId: "stability", min: 0, max: 10, direction: "higher_better", explanation: "Stable inputs support this choice." },
          { id: "speed", label: "Speed", weight: 30, questionId: "speed", min: 0, max: 10, direction: "higher_better", explanation: "Higher speed favors this choice." },
        ],
      },
    ],
  },
};

function score(optionId: string, totalScore: number, confidence: number, strengths: string[] = [], weaknesses: string[] = []): DecisionOptionScore {
  return {
    optionId,
    label: optionId,
    totalScore,
    confidence,
    factors: [],
    strengths,
    weaknesses,
  };
}

describe("Decision recommendation engine", () => {
  it("selects a clear winner", () => {
    const scores = [
      score("safe", 92, 90, ["Stability"], ["Speed"]),
      score("fast", 60, 72, ["Speed"], ["Stability"]),
    ];
    const risks = [
      { optionId: "safe", riskScore: 10, riskLevel: "low" as const, riskFactors: [], explanation: "Low risk", mitigationTips: [] },
      { optionId: "fast", riskScore: 15, riskLevel: "low" as const, riskFactors: [], explanation: "Low risk", mitigationTips: [] },
    ];

    const winner = selectWinner(scores, risks);
    const recommendation = generateRecommendation(workflow, { stability: 9, speed: 3 }, scores, risks);

    expect(winner?.optionId).toBe("safe");
    expect(recommendation.winnerOptionId).toBe("safe");
    expect(recommendation.summary).toContain("supported");
    expect(recommendation.whyThisWins.length).toBeGreaterThan(0);
    expect(recommendation.confidence).toBeGreaterThan(0);
  });

  it("handles close scores with a clear explanation", () => {
    const scores = [
      score("safe", 78, 82, ["Stability"], ["Speed"]),
      score("fast", 76, 84, ["Speed"], ["Stability"]),
    ];
    const risks = [
      { optionId: "safe", riskScore: 12, riskLevel: "medium" as const, riskFactors: [], explanation: "Medium risk", mitigationTips: [] },
      { optionId: "fast", riskScore: 11, riskLevel: "medium" as const, riskFactors: [], explanation: "Medium risk", mitigationTips: [] },
    ];

    const recommendation = generateRecommendation(workflow, { stability: 6, speed: 6 }, scores, risks);

    expect(recommendation.disclaimerNote).toContain("close");
    expect(recommendation.alternativeOptions).toHaveLength(1);
    expect(recommendation.tradeOffs.length).toBeGreaterThan(0);
  });

  it("keeps a high-risk winner explainable", () => {
    const scores = [
      score("safe", 85, 81, ["Stability"], ["Speed"]),
      score("fast", 100, 88, ["Speed"], ["Stability"]),
    ];
    const risks = [
      { optionId: "safe", riskScore: 5, riskLevel: "low" as const, riskFactors: [], explanation: "Low risk", mitigationTips: [] },
      {
        optionId: "fast",
        riskScore: 30,
        riskLevel: "high" as const,
        riskFactors: [{ id: "fast-risk", label: "Fast risk", score: 30, severity: "high" as const, explanation: "High uncertainty", mitigationTips: ["Slow down"], source: "workflow-rule", optionId: "fast" }],
        explanation: "High risk",
        mitigationTips: ["Slow down"],
      },
    ];

    const recommendation = generateRecommendation(workflow, { stability: 9, speed: 10 }, scores, risks);

    expect(recommendation.winnerOptionId).toBe("fast");
    expect(recommendation.avoidIf.join(" ")).toContain("high-risk");
    expect(recommendation.whyThisWins.join(" ")).toContain("risk");
  });

  it("produces alternative recommendation details", () => {
    const scores = [
      score("safe", 84, 88, ["Stability"], ["Speed"]),
      score("fast", 74, 80, ["Speed"], ["Stability"]),
    ];
    const risks = [
      { optionId: "safe", riskScore: 10, riskLevel: "low" as const, riskFactors: [], explanation: "Low risk", mitigationTips: [] },
      { optionId: "fast", riskScore: 15, riskLevel: "medium" as const, riskFactors: [], explanation: "Medium risk", mitigationTips: [] },
    ];

    const recommendation = generateRecommendation(workflow, { stability: 8, speed: 4 }, scores, risks);

    expect(recommendation.alternativeOptions[0]?.optionId).toBe("fast");
    expect(recommendation.alternativeOptions[0]?.tradeOffs.length).toBeGreaterThan(0);
    expect(recommendation.alternativeOptions[0]?.whyNotWinner).toContain("safe");
  });

  it("generates trade-offs from winner and alternatives", () => {
    const winner = {
      optionId: "safe",
      label: "Safe option",
      totalScore: 88,
      confidence: 90,
      riskScore: 10,
      riskLevel: "low" as const,
      adjustedScore: 86,
      strengths: ["Stability"],
      weaknesses: ["Speed"],
      factors: [],
    };
    const alternatives = [
      {
        optionId: "fast",
        label: "Fast option",
        totalScore: 86,
        confidence: 82,
        riskScore: 25,
        riskLevel: "high" as const,
        adjustedScore: 77,
        strengths: ["Speed"],
        weaknesses: ["Stability"],
        factors: [],
      },
    ];

    const tradeOffs = generateTradeOffs(winner, alternatives);
    expect(tradeOffs.join(" ")).toContain("risk");
    expect(tradeOffs.length).toBeGreaterThan(0);
  });

  it("uses confidence in the final recommendation output", () => {
    const scores = [
      score("safe", 90, 95, ["Stability"], []),
      score("fast", 65, 70, ["Speed"], []),
    ];
    const risks = [
      { optionId: "safe", riskScore: 8, riskLevel: "low" as const, riskFactors: [], explanation: "Low risk", mitigationTips: [] },
      { optionId: "fast", riskScore: 12, riskLevel: "low" as const, riskFactors: [], explanation: "Low risk", mitigationTips: [] },
    ];

    const recommendation = generateRecommendation(workflow, { stability: 10, speed: 2 }, scores, risks);
    expect(recommendation.confidence).toBeGreaterThan(0);
    expect(recommendation.confidence).toBeLessThanOrEqual(100);
    expect(recommendation.bestFor.join(" ")).toContain("Best for");
  });

  it("can derive explanations from scoring and risk data", () => {
    const scores = calculateOptionScores(workflow, { stability: 8, speed: 2 });
    const risks = [
      calculateRisk(workflow, "safe", { stability: 8, speed: 2 }, scores[0]!),
      calculateRisk(workflow, "fast", { stability: 8, speed: 2 }, scores[1]!),
    ];
    const winner = selectWinner(scores, risks)!;

    const why = generateWhyThisWins(winner, scores, risks);
    const bestFor = generateBestFor(winner, { stability: 8, speed: 2 });
    const avoidIf = generateAvoidIf(winner, { stability: 8, speed: 2 }, risks);

    expect(why.length).toBeGreaterThan(0);
    expect(bestFor.length).toBeGreaterThan(0);
    expect(avoidIf.length).toBeGreaterThan(0);
  });
});
