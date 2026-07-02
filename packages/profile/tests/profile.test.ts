import { describe, expect, it } from "vitest";
import { buildProfileAwareRecommendation } from "../src/recommendation";
import {
  getMissingProfileFields,
  getProfileAnalysis,
  getProfileAnalysisLevel,
  getProfileCompleteness,
  suggestNextBestProfileField,
} from "../src/completeness";
import type { DecisionProfile } from "../src/types";

describe("progressive profile analysis", () => {
  it("detects a basic anonymous analysis tier", () => {
    expect(getProfileAnalysisLevel(undefined)).toBe("basic");
    expect(getProfileAnalysis(undefined).label).toBe("Basic Analysis");
  });

  it("raises profile completeness when local details are available", () => {
    const profile: DecisionProfile = {
      monthlyIncome: 120000,
      monthlyExpenses: 65000,
      country: "India",
      preferredCurrency: "INR",
      goals: ["buy a house"],
    };

    const completeness = getProfileCompleteness(profile);
    expect(completeness.score).toBeGreaterThan(0);
    expect(completeness.missingFields).toContain("occupation");
    expect(getProfileAnalysisLevel(profile)).toBe("better");
    expect(getMissingProfileFields(profile)[0].name).toBe("emergencyFund");
  });

  it("suggests the next most valuable missing field", () => {
    const profile: DecisionProfile = {};
    expect(suggestNextBestProfileField(profile)?.name).toBe("monthlyIncome");
  });

  it("promotes advanced analysis when cloud history exists", () => {
    const profile: DecisionProfile = { cloudHistoryCount: 4 };
    expect(getProfileAnalysis(profile).level).toBe("advanced");
    expect(getProfileAnalysis(profile).label).toBe("Advanced Analysis");
  });

  it("wraps a recommendation with profile-aware guidance", () => {
    const output = buildProfileAwareRecommendation(
      { title: "Proceed", summary: "Looks viable", actions: ["Review terms"] },
      { monthlyIncome: 90000, monthlyExpenses: 45000, preferredCurrency: "INR" },
    );

    expect(output.analysis.level).toBe("better");
    expect(output.analysisNote).toContain("local profile");
    expect(output.recommendation.title).toBe("Proceed");
  });
});
