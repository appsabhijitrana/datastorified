import { describe, expect, it } from "vitest";
import { decisionRouteFromText } from "../../lib/decision-routing";

describe("DecisionSearch", () => {
  it("routes known search phrases through the decision router helper", () => {
    expect(decisionRouteFromText("buy a house")).toBeTruthy();
  });
});
