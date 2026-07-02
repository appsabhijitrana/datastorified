import { describe, expect, it } from "vitest";
import {
  calculateConfidence,
  calculateOptionScores,
  calculateWeightedScore,
  normalizeScore,
  rankOptions,
  type DecisionOptionScore,
} from "../core/scoringEngine";
import type { DecisionWorkflow } from "../types";

const scoringWorkflow: DecisionWorkflow = {
  id: "scoring-workflow",
  slug: "scoring-workflow",
  pluginId: "test-plugin",
  version: "1.0.0",
  title: "Scoring workflow",
  category: "career",
  description: "A generic scoring setup for testing.",
  intent: {
    keywords: ["score", "option"],
    aliases: ["scoring workflow"],
    examples: ["score the options"],
  },
  questions: [
    { id: "stability", prompt: "Stability", type: "number", required: true },
    { id: "flexibility", prompt: "Flexibility", type: "number", required: true },
  ],
  rules: [],
  weights: [],
  recommendations: [
    { id: "default", minScore: 0, maxScore: 100, title: "Default", summary: "Generic", actions: ["Review inputs"] },
  ],
  scoring: {
    missingAnswerScore: 50,
    options: [
      {
        id: "buy",
        label: "Buy",
        factors: [
          {
            id: "stability-fit",
            label: "Stability fit",
            weight: 60,
            questionId: "stability",
            min: 0,
            max: 10,
            direction: "higher_better",
            explanation: "Higher stability helps buying.",
          },
          {
            id: "flexibility-fit",
            label: "Flexibility fit",
            weight: 40,
            questionId: "flexibility",
            min: 0,
            max: 10,
            direction: "lower_better",
            explanation: "Lower flexibility needs help buying.",
          },
        ],
      },
      {
        id: "rent",
        label: "Rent",
        factors: [
          {
            id: "stability-fit",
            label: "Stability fit",
            weight: 60,
            questionId: "stability",
            min: 0,
            max: 10,
            direction: "lower_better",
            explanation: "Lower commitment can favor renting.",
          },
          {
            id: "flexibility-fit",
            label: "Flexibility fit",
            weight: 40,
            questionId: "flexibility",
            min: 0,
            max: 10,
            direction: "higher_better",
            explanation: "Higher flexibility supports renting.",
          },
        ],
      },
    ],
  },
};

describe("Decision scoring engine", () => {
  it("normalizes scores in both directions", () => {
    expect(normalizeScore(8, 0, 10, "higher_better")).toBe(80);
    expect(normalizeScore(2, 0, 10, "lower_better")).toBe(80);
    expect(normalizeScore(0, 0, 10, "lower_better")).toBe(100);
  });

  it("calculates weighted scores", () => {
    const score = calculateWeightedScore([
      { weight: 60, rawScore: 8, normalizedScore: 80, direction: "higher_better" },
      { weight: 40, rawScore: 2, normalizedScore: 80, direction: "lower_better" },
    ]);

    expect(score).toBe(80);
  });

  it("ranks options by score and keeps stable order on ties", () => {
    const tied: DecisionOptionScore[] = [
      { optionId: "buy", label: "Buy", totalScore: 72, confidence: 80, factors: [], strengths: [], weaknesses: [] },
      { optionId: "rent", label: "Rent", totalScore: 72, confidence: 80, factors: [], strengths: [], weaknesses: [] },
    ];

    expect(rankOptions(tied).map((option) => option.optionId)).toEqual(["buy", "rent"]);
  });

  it("calculates option scores with factor breakdowns and confidence", () => {
    const scores = calculateOptionScores(scoringWorkflow, { stability: 8, flexibility: 8 });
    const buy = scores.find((score) => score.optionId === "buy");
    const rent = scores.find((score) => score.optionId === "rent");

    expect(buy?.totalScore).toBe(56);
    expect(rent?.totalScore).toBe(44);
    expect(buy?.confidence).toBe(rent?.confidence);
    expect(buy?.factors[0]).toEqual(expect.objectContaining({
      factorId: "stability-fit",
      rawScore: 8,
      normalizedScore: 80,
    }));
    expect(buy?.strengths).toContain("Higher stability helps buying.");
    expect(buy?.weaknesses).toContain("Lower flexibility needs help buying.");
  });

  it("reduces confidence when answers are missing", () => {
    const complete = calculateOptionScores(scoringWorkflow, { stability: 8, flexibility: 8 });
    const partial = calculateOptionScores(scoringWorkflow, { stability: 8 });

    expect(partial[0]?.factors[1]?.missing).toBe(true);
    expect(partial[0]?.factors[1]?.normalizedScore).toBe(50);
    expect(partial[0]?.confidence).toBeLessThan(complete[0]?.confidence ?? 0);
  });

  it("calculates confidence from the score gap and completeness", () => {
    const scores = calculateOptionScores(scoringWorkflow, { stability: 8, flexibility: 8 });
    const confidence = calculateConfidence(scores, { stability: 8, flexibility: 8 }, scoringWorkflow);

    expect(confidence).toBe(scores[0]?.confidence);
    expect(confidence).toBeGreaterThan(60);
  });

  it("handles ties without reordering equal scores", () => {
    const tiedScores: DecisionOptionScore[] = [
      { optionId: "alpha", label: "Alpha", totalScore: 55, confidence: 70, factors: [], strengths: [], weaknesses: [] },
      { optionId: "beta", label: "Beta", totalScore: 55, confidence: 70, factors: [], strengths: [], weaknesses: [] },
      { optionId: "gamma", label: "Gamma", totalScore: 50, confidence: 80, factors: [], strengths: [], weaknesses: [] },
    ];

    expect(rankOptions(tiedScores).map((option) => option.optionId)).toEqual(["alpha", "beta", "gamma"]);
  });
});
