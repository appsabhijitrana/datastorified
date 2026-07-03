import { describe, expect, it } from "vitest";
import { buildDecisionReport } from "../core/reportEngine";
import { calculateOptionScores } from "../core/scoringEngine";
import { calculateRisk } from "../core/riskEngine";
import { generateRecommendation, selectWinner } from "../core/recommendationEngine";
import { generateActionPlan } from "../core/actionPlanEngine";
import { decisionPluginRegistry } from "../plugins/staticPlugins";

describe("fd vs sip workflow", () => {
  it("registers the canonical slug and keeps the legacy slug working", () => {
    const workflow = decisionPluginRegistry.getWorkflowBySlug("fd-vs-sip");
    expect(workflow?.id).toBe("fd-vs-sip");
    expect(decisionPluginRegistry.getWorkflowBySlug("sip-vs-fd")?.slug).toBe("fd-vs-sip");
    expect(workflow?.questions).toHaveLength(9);
    expect(workflow?.scoring?.options).toHaveLength(2);
    expect(workflow?.scenarioVariables).toHaveLength(5);
    expect(workflow?.assumptions?.join(" ")).toContain("not financial advice");
  });

  it("prefers SIP for a long-term, growth-oriented profile", () => {
    const workflow = decisionPluginRegistry.getWorkflowBySlug("fd-vs-sip");
    if (!workflow) throw new Error("workflow missing");
    const answers = {
      investmentAmount: 250000,
      timeHorizon: 12,
      riskAppetite: 3,
      liquidityNeed: 1,
      emergencyFundStatus: true,
      taxBracket: 3,
      goalType: "growth",
      returnExpectation: 12,
      volatilityComfort: 4,
    };
    const report = buildDecisionReport(workflow, answers, { id: "fd-vs-sip-test", generatedAt: "2026-07-03T00:00:00.000Z" });
    const scores = calculateOptionScores(workflow, answers);
    const risks = scores.map((score) => calculateRisk(workflow, score.optionId, answers, score));
    const winner = selectWinner(scores, risks);
    const recommendation = generateRecommendation(workflow, answers, scores, risks);
    const actionPlan = generateActionPlan(workflow, answers, recommendation, risks);

    expect(scores).toHaveLength(2);
    expect(scores.find((score) => score.optionId === "sip-mutual-fund")?.totalScore).toBeGreaterThan(scores.find((score) => score.optionId === "fixed-deposit")?.totalScore ?? 0);
    expect(winner?.optionId).toBe("sip-mutual-fund");
    expect(report.recommendation?.title).toContain("SIP");
    expect(recommendation.winnerOptionId).toBe("sip-mutual-fund");
    expect(actionPlan.steps.length).toBeGreaterThan(0);
  });

  it("prefers FD for a short-term, low-risk profile", () => {
    const workflow = decisionPluginRegistry.getWorkflowBySlug("fd-vs-sip");
    if (!workflow) throw new Error("workflow missing");
    const answers = {
      investmentAmount: 100000,
      timeHorizon: 2,
      riskAppetite: 1,
      liquidityNeed: 3,
      emergencyFundStatus: false,
      taxBracket: 1,
      goalType: "short_term",
      returnExpectation: 7,
      volatilityComfort: 1,
    };
    const report = buildDecisionReport(workflow, answers);

    expect(report.score.value).toBeLessThan(45);
    expect(report.recommendation?.title).toContain("Fixed Deposit");
    expect(report.actionPlan.length).toBeGreaterThan(0);
    expect(report.risks.length).toBeGreaterThan(0);
  });
});
