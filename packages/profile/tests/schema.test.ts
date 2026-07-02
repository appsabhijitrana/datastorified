import { describe, expect, it } from "vitest";
import { decisionProfileSchema, decisionProfileEnvelopeSchema } from "../src/schema";

describe("profile validation", () => {
  it("accepts valid profile envelopes", () => {
    const result = decisionProfileEnvelopeSchema.safeParse({
      profile: {
        country: "India",
        monthlyIncome: 120000,
        monthlyExpenses: 60000,
        goals: ["buy a house"],
      },
      lastOpenedWorkflow: {
        workflowId: "buy-house",
        pluginId: "property",
        slug: "buy-house",
        openedAt: "2026-07-02T00:00:00.000Z",
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid profile values", () => {
    expect(decisionProfileSchema.safeParse({ monthlyIncome: -1 }).success).toBe(false);
    expect(decisionProfileSchema.safeParse({ riskProfile: "reckless" }).success).toBe(false);
    expect(decisionProfileSchema.safeParse({ goals: [""] }).success).toBe(false);
  });
});
