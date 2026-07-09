import { describe, expect, it } from "vitest";
import { getAllDecisions, getDecisionBySlug, getDecisionRoute, getLiveDecisions, getPopularDecisions, getQuickDecisions, getRelatedDecisions, getTrendingDecisions, searchDecisions } from "../discovery/decisionRegistry";

describe("discovery decision registry", () => {
  it("returns live decisions with routes", () => {
    const live = getLiveDecisions();
    expect(live.length).toBeGreaterThan(0);
    expect(getDecisionRoute("buy-house")).toBe("/decision/property/buy-house");
  });

  it("keeps coming soon decisions off broken routes", () => {
    const phone = getDecisionBySlug("phone-comparison") ?? getAllDecisions().find((decision) => decision.slug === "phone-comparison");
    expect(phone?.status).toBe("coming_soon");
    expect(getDecisionRoute("phone-comparison")).toBeUndefined();
  });

  it("supports discovery selectors", () => {
    expect(getPopularDecisions().length).toBeGreaterThan(0);
    expect(getTrendingDecisions().length).toBeGreaterThan(0);
    expect(getQuickDecisions().length).toBeGreaterThan(0);
    expect(searchDecisions("rent or buy")[0]?.slug).toBe("rent-vs-buy");
    expect(getRelatedDecisions("fd-vs-sip").length).toBeGreaterThan(0);
  });
});
