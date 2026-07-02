import { describe, expect, it } from "vitest";
import { decisionPluginRegistry } from "@datastorified/decision-os";
import { buildPersonalizedRecommendations } from "../src";

describe("personalization", () => {
  it("suggests emergency fund when the buffer is weak", () => {
    const output = buildPersonalizedRecommendations({
      profile: { monthlyExpenses: 50000, emergencyFund: 90000, riskProfile: "conservative", goals: ["save"] },
    });
    expect(output.workflowRecommendations[0]?.workflow.slug).toBe("emergency-fund");
  });

  it("suggests housing workflows after EMI calculator usage", () => {
    const output = buildPersonalizedRecommendations({
      recentCalculators: ["emi-calculator"],
      favoriteCalculators: ["home-affordability-calculator"],
    });
    expect(output.workflowRecommendations.some((item) => item.workflow.slug === "buy-house" || item.workflow.slug === "rent-vs-buy")).toBe(true);
  });

  it("surfaces profile completion recommendations", () => {
    const output = buildPersonalizedRecommendations({
      profile: { monthlyIncome: 100000, monthlyExpenses: 80000, goals: ["debt"], riskProfile: "conservative" },
    });
    expect(output.profileRecommendations.length).toBeGreaterThan(0);
    expect(output.nextBestActions.length).toBeGreaterThan(0);
  });

  it("keeps workflow suggestions backed by real workflows", () => {
    const output = buildPersonalizedRecommendations({
      profile: { liabilities: 900000, monthlyIncome: 120000, goals: ["debt"] },
    });
    expect(decisionPluginRegistry.getWorkflow(output.workflowRecommendations[0]!.workflow.id)).toBeDefined();
  });
});
