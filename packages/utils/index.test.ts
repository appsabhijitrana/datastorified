import { describe, expect, it } from "vitest";
import { fuzzyScore, fuzzySearch } from ".";
describe("fuzzy search", () => {
  it("ranks exact, prefix, and substring matches", () => { expect(fuzzyScore("emi", "EMI")).toBeGreaterThan(fuzzyScore("emi", "EMI Calculator")); expect(fuzzyScore("emi", "Best EMI Calculator")).toBeGreaterThan(0); });
  it("tolerates a meaningful typo", () => expect(fuzzyScore("calclator", "calculator")).toBeGreaterThan(0));
  it("rejects unrelated content", () => expect(fuzzyScore("mortgage", "word counter")).toBe(0));
  it("preserves source order for equally ranked results", () => expect(fuzzySearch(["SIP planner", "SIP return"], "sip", String)).toEqual(["SIP planner", "SIP return"]));
});
