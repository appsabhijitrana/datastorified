import { describe, expect, it } from "vitest";
import { buildDecisionReport } from "../core/reportEngine";
import { calculateOptionScores } from "../core/scoringEngine";
import { calculateRisk } from "../core/riskEngine";
import { generateActionPlan } from "../core/actionPlanEngine";
import { generateRecommendation, selectWinner } from "../core/recommendationEngine";
import { decisionPluginRegistry } from "../plugins/staticPlugins";

describe("rent vs buy workflow", () => {
  it("registers the canonical slug and keeps the expected metadata", () => {
    const workflow = decisionPluginRegistry.getWorkflowBySlug("rent-vs-buy");
    expect(workflow?.id).toBe("rent-vs-buy");
    expect(workflow?.questions).toHaveLength(17);
    expect(workflow?.scoring?.options).toHaveLength(2);
    expect(workflow?.scenarioVariables).toHaveLength(6);
    expect(workflow?.assumptions?.join(" ")).toContain("not legal, real-estate, or financial advice");
  });

  it("leans toward renting for a short stay with high flexibility and EMI pressure", () => {
    const workflow = decisionPluginRegistry.getWorkflowBySlug("rent-vs-buy");
    if (!workflow) throw new Error("workflow missing");

    const answers = {
      cityLocationType: 1,
      monthlyRent: 30_000,
      propertyPrice: 12_000_000,
      downPaymentAvailable: 1_500_000,
      expectedLoanEmi: 95_000,
      monthlyIncome: 180_000,
      monthlyExpenses: 70_000,
      currentEmergencyFund: 250_000,
      incomeStability: 1,
      plannedStayDuration: 2,
      familyStabilityNeed: 1,
      maintenanceCost: 10_000,
      investmentOpportunityCost: 8,
      flexibilityPreference: 5,
      debtComfort: 1,
      hasLoanPreapproval: false,
      locationNotes: "Temporary assignment only",
    };

    const report = buildDecisionReport(workflow, answers, { id: "rent-vs-buy-rent", generatedAt: "2026-07-03T00:00:00.000Z" });
    const scores = calculateOptionScores(workflow, answers);
    const risks = scores.map((score) => calculateRisk(workflow, score.optionId, answers, score));
    const winner = selectWinner(scores, risks);
    const recommendation = generateRecommendation(workflow, answers, scores, risks);
    const actionPlan = generateActionPlan(workflow, answers, recommendation, risks);

    expect(scores.find((score) => score.optionId === "rent")?.totalScore).toBeGreaterThan(scores.find((score) => score.optionId === "buy")?.totalScore ?? 0);
    expect(winner?.optionId).toBe("rent");
    expect(report.recommendation?.title).toContain("Rent");
    expect(recommendation.winnerOptionId).toBe("rent");
    expect(actionPlan.steps.length).toBeGreaterThan(0);
  });

  it("leans toward buying for a long stay with stable income and manageable debt", () => {
    const workflow = decisionPluginRegistry.getWorkflowBySlug("rent-vs-buy");
    if (!workflow) throw new Error("workflow missing");

    const answers = {
      cityLocationType: 3,
      monthlyRent: 60_000,
      propertyPrice: 10_000_000,
      downPaymentAvailable: 3_000_000,
      expectedLoanEmi: 52_000,
      monthlyIncome: 220_000,
      monthlyExpenses: 80_000,
      currentEmergencyFund: 1_200_000,
      incomeStability: 3,
      plannedStayDuration: 10,
      familyStabilityNeed: 5,
      maintenanceCost: 7_000,
      investmentOpportunityCost: 6,
      flexibilityPreference: 2,
      debtComfort: 4,
      hasLoanPreapproval: true,
      locationNotes: "School network and neighborhood fit",
    };

    const report = buildDecisionReport(workflow, answers);
    const scores = calculateOptionScores(workflow, answers);
    const risks = scores.map((score) => calculateRisk(workflow, score.optionId, answers, score));
    const winner = selectWinner(scores, risks);

    expect(scores.find((score) => score.optionId === "buy")?.totalScore).toBeGreaterThan(scores.find((score) => score.optionId === "rent")?.totalScore ?? 0);
    expect(winner?.optionId).toBe("buy");
    expect(report.recommendation?.title).toContain("Buying");
    expect(report.actionPlan.length).toBeGreaterThan(0);
  });

  it("shows a balanced recommendation when the rent and buy case are close", () => {
    const workflow = decisionPluginRegistry.getWorkflowBySlug("rent-vs-buy");
    if (!workflow) throw new Error("workflow missing");

    const answers = {
      cityLocationType: 2,
      monthlyRent: 60_000,
      propertyPrice: 8_500_000,
      downPaymentAvailable: 500_000,
      expectedLoanEmi: 50_000,
      monthlyIncome: 180_000,
      monthlyExpenses: 70_000,
      currentEmergencyFund: 500_000,
      incomeStability: 2,
      plannedStayDuration: 7,
      familyStabilityNeed: 3,
      maintenanceCost: 5_000,
      investmentOpportunityCost: 10,
      flexibilityPreference: 3,
      debtComfort: 3,
      hasLoanPreapproval: true,
      locationNotes: "Both options feel workable",
    };

    const report = buildDecisionReport(workflow, answers);

    expect(report.recommendation?.title.toLowerCase()).toContain("balanced");
    expect(report.score.value).toBeGreaterThanOrEqual(0);
    expect(report.score.value).toBeLessThanOrEqual(100);
  });
});
