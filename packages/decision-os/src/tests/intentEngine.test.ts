import { describe, expect, it } from "vitest";
import { detectIntent } from "../core/intentEngine";
import { learningWorkflow, workflow } from "./fixtures";

describe("intent engine", () => {
  it("selects the workflow whose configured language matches the input", () => {
    const result = detectIntent("Should I work remotely or in an office?", [learningWorkflow, workflow]);
    expect(result.bestMatch?.workflowId).toBe("workspace-choice");
    expect(result.bestMatch?.confidence).toBeGreaterThan(0.7);
    expect(result.bestMatch?.matchedTerms).toContain("remote");
  });
});
