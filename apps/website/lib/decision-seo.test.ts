import { describe, expect, it } from "vitest";
import { decisions } from "@datastorified/decision-engine";
import { decisionHubSeo, decisionSeoById } from "./decision-seo";

describe("decision SEO", () => {
  it("covers every registered decision URL", () => {
    expect(Object.keys(decisionSeoById).sort()).toEqual(decisions.map(({ id }) => id).sort());
  });

  it("provides unique, useful metadata and long-tail queries", () => {
    const entries = Object.values(decisionSeoById);
    expect(new Set(entries.map(({ title }) => title)).size).toBe(entries.length);
    expect(new Set(entries.map(({ description }) => description)).size).toBe(entries.length);
    expect(entries.every(({ title }) => title.length <= 60)).toBe(true);
    expect(entries.every(({ description }) => description.length >= 120 && description.length <= 170)).toBe(true);
    expect(entries.every(({ longTailKeywords }) => longTailKeywords.length >= 5)).toBe(true);
  });

  it("defines search intent for the decision hub", () => {
    expect(decisionHubSeo.primaryKeyword).toBe("free decision-making tools");
    expect(decisionHubSeo.longTailKeywords.length).toBeGreaterThanOrEqual(4);
  });
});
