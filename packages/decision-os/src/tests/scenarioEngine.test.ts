import { describe, expect, it } from "vitest";
import { recalculateScenario } from "../core/scenarioEngine";
import { workflow } from "./fixtures";

describe("scenario engine", () => {
  it("merges scenario overrides and recalculates the complete report", () => {
    const result = recalculateScenario(workflow, { workStyle: "team", experience: "low" }, workflow.scenarios![0]);
    expect(result.answers.experience).toBe("high");
    expect(result.report.score.value).toBe(74);
    expect(result.scoreDelta).toBe(24);
    expect(result.report.recommendation?.id).toBe("proceed");
  });
});
