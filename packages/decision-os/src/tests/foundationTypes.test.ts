import { describe, expect, it } from "vitest";
import type {
  ActionPlan,
  DecisionDraft,
  DecisionOption,
  DecisionRepository,
  DecisionResult,
  DecisionSession,
  QuestionAnswer,
  QuestionType,
  RecommendationResult,
  RiskFactor,
  RiskModel,
  ScoreFactor,
  ScoringModel,
  SimulationInput,
  SimulationResult,
} from "../core/foundation";

describe("decision os foundation types", () => {
  it("supports a generic plugin-based decision domain", () => {
    const questionTypes: QuestionType[] = ["text", "number", "boolean", "currency", "percentage", "select", "slider", "duration"];
    const option: DecisionOption<number> = { id: "yes", label: "Yes", value: 1 };
    const answer: QuestionAnswer = { questionId: "q1", value: "yes" };
    const scoreFactor: ScoreFactor = { id: "income", label: "Income fit", weight: 0.4 };
    const scoringModel: ScoringModel = { id: "score", label: "Base scoring", factors: [scoreFactor] };
    const riskFactor: RiskFactor = { id: "cash", label: "Cash buffer", weight: 0.5, severity: "high" };
    const riskModel: RiskModel = { id: "risk", label: "Base risk", factors: [riskFactor] };
    const recommendation: RecommendationResult = { title: "Proceed", summary: "The current setup is supportive.", actions: ["Review assumptions", "Compare alternatives"] };
    const actionPlan: ActionPlan = { steps: ["Gather documents", "Run the scenario", "Decide"], warnings: ["Assumptions can change"] };
    const session: DecisionSession = {
      id: "session-1",
      workflowId: "workflow-1",
      pluginId: "finance",
      status: "draft",
      answers: { q1: "yes" },
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const draft: DecisionDraft = {
      workflowId: "workflow-1",
      pluginId: "finance",
      answers: { q1: "yes" },
      updatedAt: new Date().toISOString(),
    };
    const input: SimulationInput = {
      workflowId: "workflow-1",
      pluginId: "finance",
      answers: { q1: "yes" },
      overrides: { q1: "maybe" },
      scenarioId: "scenario-1",
    };
    const result: DecisionResult = {
      id: "result-1",
      workflowId: "workflow-1",
      pluginId: "finance",
      answers: { q1: "yes" },
      score: { value: 72, max: 100, percentage: 72, factors: [] },
      risk: { id: "risk-1", title: "Moderate risk", description: "Manageable but not trivial.", severity: "medium" },
      recommendation,
      actionPlan,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const simulation: SimulationResult = { input, score: result.score, risk: result.risk, recommendation, actionPlan };
    const repository: DecisionRepository = {
      async saveDecision(decision) { return decision; },
      async getDecision() { return result; },
      async listDecisions() { return [result]; },
      async deleteDecision() {},
      async saveDraft(nextDraft) { return nextDraft; },
      async getDraft() { return draft; },
      async listDrafts() { return [draft]; },
      async saveSession(nextSession) { return nextSession; },
      async getSession() { return session; },
    };

    expect(questionTypes).toContain("currency");
    expect(option.value).toBe(1);
    expect(answer.questionId).toBe("q1");
    expect(scoringModel.factors[0]?.id).toBe("income");
    expect(riskModel.factors[0]?.severity).toBe("high");
    expect(simulation.actionPlan.steps).toHaveLength(3);
    expect(repository).toBeTruthy();
  });
});
