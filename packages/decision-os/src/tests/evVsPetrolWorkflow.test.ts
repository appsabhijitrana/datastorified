import { describe, expect, it } from "vitest";
import { buildDecisionReport } from "../core/reportEngine";
import { calculateOptionScores } from "../core/scoringEngine";
import { calculateRisk } from "../core/riskEngine";
import { generateActionPlan } from "../core/actionPlanEngine";
import { generateRecommendation, selectWinner } from "../core/recommendationEngine";
import { decisionPluginRegistry } from "../plugins/staticPlugins";

describe("ev vs petrol workflow", () => {
  it("registers the canonical slug and exposes the expected metadata", () => {
    const workflow = decisionPluginRegistry.getWorkflowBySlug("ev-vs-petrol");
    expect(workflow?.id).toBe("ev-vs-petrol");
    expect(workflow?.questions).toHaveLength(10);
    expect(workflow?.scoring?.options).toHaveLength(2);
    expect(workflow?.scenarioVariables).toHaveLength(6);
    expect(workflow?.assumptions?.join(" ")).toContain("educational decision support");
  });

  it("prefers EV for a high-usage city-driving profile with home charging", () => {
    const workflow = decisionPluginRegistry.getWorkflowBySlug("ev-vs-petrol");
    if (!workflow) throw new Error("workflow missing");

    const answers = {
      monthlyDistance: 2200,
      usagePattern: 1,
      homeChargingAccess: 2,
      workChargingAccess: 2,
      vehicleBudget: 2_000_000,
      resaleConcern: 2,
      runningCostPriority: 5,
      longDistanceTravelFrequency: 1,
      maintenanceConcern: 4,
      environmentalPriority: 5,
      petrolPrice: 120,
      electricityCost: 8,
    };

    const report = buildDecisionReport(workflow, answers, { id: "ev-vs-petrol-ev", generatedAt: "2026-07-03T00:00:00.000Z" });
    const scores = calculateOptionScores(workflow, answers);
    const risks = scores.map((score) => calculateRisk(workflow, score.optionId, answers, score));
    const winner = selectWinner(scores, risks);
    const recommendation = generateRecommendation(workflow, answers, scores, risks);
    const actionPlan = generateActionPlan(workflow, answers, recommendation, risks);

    expect(scores.find((score) => score.optionId === "electric-vehicle")?.totalScore).toBeGreaterThan(scores.find((score) => score.optionId === "petrol-vehicle")?.totalScore ?? 0);
    expect(winner?.optionId).toBe("electric-vehicle");
    expect(report.recommendation?.title.toLowerCase()).toContain("electric vehicle");
    expect(recommendation.winnerOptionId).toBe("electric-vehicle");
    expect(actionPlan.steps.length).toBeGreaterThan(0);
  });

  it("prefers petrol for low usage, frequent highway travel, and no charging access", () => {
    const workflow = decisionPluginRegistry.getWorkflowBySlug("ev-vs-petrol");
    if (!workflow) throw new Error("workflow missing");

    const answers = {
      monthlyDistance: 700,
      usagePattern: 3,
      homeChargingAccess: 0,
      workChargingAccess: 0,
      vehicleBudget: 950_000,
      resaleConcern: 4,
      runningCostPriority: 1,
      longDistanceTravelFrequency: 3,
      maintenanceConcern: 2,
      environmentalPriority: 1,
      petrolPrice: 105,
      electricityCost: 11,
    };

    const report = buildDecisionReport(workflow, answers);
    const scores = calculateOptionScores(workflow, answers);

    expect(scores.find((score) => score.optionId === "petrol-vehicle")?.totalScore).toBeGreaterThan(scores.find((score) => score.optionId === "electric-vehicle")?.totalScore ?? 0);
    expect(report.recommendation?.title.toLowerCase()).toContain("petrol");
    expect(report.actionPlan.length).toBeGreaterThan(0);
  });

  it("shows a balanced recommendation when usage and infrastructure are mixed", () => {
    const workflow = decisionPluginRegistry.getWorkflowBySlug("ev-vs-petrol");
    if (!workflow) throw new Error("workflow missing");

    const answers = {
      monthlyDistance: 1400,
      usagePattern: 2,
      homeChargingAccess: 1,
      workChargingAccess: 1,
      vehicleBudget: 1_400_000,
      resaleConcern: 3,
      runningCostPriority: 3,
      longDistanceTravelFrequency: 2,
      maintenanceConcern: 3,
      environmentalPriority: 3,
      petrolPrice: 110,
      electricityCost: 9,
    };

    const report = buildDecisionReport(workflow, answers);

    expect(report.recommendation?.title.toLowerCase()).toContain("balanced");
    expect(report.score.value).toBeGreaterThanOrEqual(0);
    expect(report.score.value).toBeLessThanOrEqual(100);
  });
});
