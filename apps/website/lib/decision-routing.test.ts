import { describe, expect, it } from "vitest";
import { decisionRouteFromText } from "./decision-routing";

describe("Decision OS frontend routing", () => {
  it("opens the house workflow for the acceptance search", () => {
    expect(decisionRouteFromText("Should I buy a house?")).toBe("/decision/property/buy-house");
  });

  it("does not route unrelated text", () => {
    expect(decisionRouteFromText("zebra quantum nebula")).toBeUndefined();
  });
});
