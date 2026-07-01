import { describe, expect, it } from "vitest";
import { selectRecommendation } from "../core/recommendationEngine";
import { workflow } from "./fixtures";

describe("recommendation engine", () => {
  it("selects the configured recommendation range", () => {
    expect(selectRecommendation(workflow.recommendations, 74)?.id).toBe("proceed");
    expect(selectRecommendation(workflow.recommendations, 30)?.id).toBe("reconsider");
  });
});
