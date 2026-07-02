import { describe, expect, it } from "vitest";
import { buildPersonalizedRecommendations } from "../src";

describe("recommendation rules", () => {
  it("suggests an emergency-fund workflow for a weak buffer", () => {
    const output = buildPersonalizedRecommendations({
      profile: {
        monthlyExpenses: 60000,
        emergencyFund: 90000,
        riskProfile: "conservative",
        goals: ["save"],
      },
    });

    expect(output.workflowRecommendations[0]?.workflow.slug).toBe("emergency-fund");
  });

  it("suggests a debt-oriented next step when liabilities are high", () => {
    const output = buildPersonalizedRecommendations({
      profile: {
        liabilities: 1_000_000,
        monthlyIncome: 100_000,
        goals: ["debt"],
      },
    });

    expect(output.workflowRecommendations.some((item) => item.workflow.slug === "loan-prepayment")).toBe(true);
  });
});
