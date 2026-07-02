import { describe, expect, it } from "vitest";
import { recalculateScenario } from "../core/scenarioEngine";
import { buyHouseWorkflow } from "../plugins/property/workflows";
import { workflow } from "./fixtures";

describe("scenario engine", () => {
  it("merges scenario overrides and recalculates the complete report", () => {
    const result = recalculateScenario(workflow, { workStyle: "team", experience: "low" }, workflow.scenarios![0]);
    expect(result.answers.experience).toBe("high");
    expect(result.report.score.value).toBe(74);
    expect(result.scoreDelta).toBe(24);
    expect(result.report.recommendation?.id).toBe("proceed");
  });

  it("keeps the original answers untouched while recalculating a real workflow scenario", () => {
    const answers = {
      monthlyIncome: 150_000,
      propertyPrice: 8_000_000,
      downPayment: 1_600_000,
      existingEmi: 15_000,
      interestRate: 8.5,
      tenure: 20,
      monthlyExpenses: 70_000,
      emergencySavings: 600_000,
      incomeStability: 2,
      stayYears: 8,
      diligenceComplete: false,
      propertyNotes: "",
    };
    const base = recalculateScenario(buyHouseWorkflow, answers, { id: "noop", label: "No-op", overrides: {} }, undefined);
    const result = recalculateScenario(buyHouseWorkflow, answers, buyHouseWorkflow.scenarios![2], base.report);
    expect(answers.propertyPrice).toBe(8_000_000);
    expect(base.answers.propertyPrice).toBe(8_000_000);
    expect(result.answers.propertyPrice).toBe(7_000_000);
    expect(result.scoreDelta).not.toBe(0);
  });
});
