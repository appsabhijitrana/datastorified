import { describe, expect, it } from "vitest";
import { DecisionOrchestrator, type DecisionOrchestratorRepository, type DecisionOrchestrationResult } from "../core/orchestrator";
import { createDefaultAnswers } from "../core/questionEngine";
import { decisionPluginRegistry } from "../plugins/staticPlugins";
import type { DecisionMemoryDraft, StoredDecision } from "../types";

function cloneDraft(draft: DecisionMemoryDraft): DecisionMemoryDraft {
  return { ...draft, answers: { ...draft.answers } };
}

function createRepository(): DecisionOrchestratorRepository & {
  storedResults: StoredDecision[];
  savedDecisions: DecisionOrchestrationResult[];
} {
  const drafts = new Map<string, DecisionMemoryDraft>();
  const storedResults: StoredDecision[] = [];
  const savedDecisions: DecisionOrchestrationResult[] = [];
  return {
    storedResults,
    savedDecisions,
    async saveDraft(draft) {
      drafts.set(draft.workflowId, cloneDraft(draft));
    },
    async getDraft(id) {
      const draft = drafts.get(id);
      return draft ? cloneDraft(draft) : undefined;
    },
    async listDrafts() {
      return [...drafts.values()].map(cloneDraft);
    },
    async deleteDraft(id) {
      drafts.delete(id);
    },
    async saveDecisionResult(decision) {
      storedResults.push({
        id: decision.id,
        workflowId: decision.workflowId,
        pluginId: decision.pluginId,
        answers: decision.answers,
        report: decision.report,
        createdAt: decision.createdAt,
        updatedAt: decision.updatedAt,
      });
      savedDecisions.push({
        workflow: decision.workflow,
        answers: { ...decision.answers },
        rankedScores: decision.report ? [] : [],
        risks: [],
        recommendation: {
          winnerOptionId: decision.recommendation.id,
          summary: decision.recommendation.summary,
          confidence: decision.confidence,
          whyThisWins: [],
          tradeOffs: [],
          bestFor: [],
          avoidIf: [],
          alternativeOptions: [],
          disclaimerNote: "",
        },
        actionPlan: {
          title: decision.workflow.title,
          summary: "",
          steps: [...decision.actionPlan],
          priority: "low",
          estimatedEffort: "low effort",
          recommendedTimeline: "soon",
          followUpQuestions: [],
        },
        confidence: decision.confidence,
        report: decision.report!,
        session: {
          id: decision.id,
          workflowId: decision.workflowId,
          pluginId: decision.pluginId,
          status: "completed",
          answers: { ...decision.answers },
          startedAt: decision.createdAt,
          updatedAt: decision.updatedAt,
          completedAt: decision.updatedAt,
        },
        completedAt: decision.updatedAt,
      });
      return undefined;
    },
    async saveResult(decision) {
      return decision;
    },
    async saveDecision(decision) {
      return decision;
    },
    async saveRecentDecision(decision) {
      return decision;
    },
    async listDecisionResults() {
      return [];
    },
    async listDecisions() {
      return [];
    },
    async listRecentDecisions() {
      return [];
    },
    async getDecision() {
      return undefined;
    },
    async deleteDecision() {
      return undefined;
    },
    async clearHistory() {
      return undefined;
    },
  };
}

describe("DecisionOrchestrator", () => {
  it("runs the full decision lifecycle", async () => {
    const repository = createRepository();
    const orchestrator = new DecisionOrchestrator({ repository });
    const workflow = decisionPluginRegistry.getWorkflowBySlug("ev-vs-petrol");
    if (!workflow) throw new Error("workflow missing");

    const started = orchestrator.startDecision(workflow.slug);
    expect(started.workflow.slug).toBe(workflow.slug);
    expect(started.currentQuestionId).toBeDefined();
    expect(started.preview.rankedScores).toHaveLength(2);

    const defaults = createDefaultAnswers(workflow.questions);
    const firstQuestionId = started.currentQuestionId ?? workflow.questions[0].id;
    const resumed = orchestrator.answerCurrentQuestion(started.session.id, defaults[firstQuestionId]);
    expect(resumed.session.answers[firstQuestionId]).toEqual(defaults[firstQuestionId]);

    const savedDraft = await orchestrator.saveDraft(resumed.session);
    expect(savedDraft.workflowId).toBe(workflow.id);
    expect(repository.savedDecisions).toHaveLength(0);

    const loaded = await orchestrator.loadDraft(workflow.id);
    expect(loaded?.workflow.id).toBe(workflow.id);
    expect(loaded?.currentQuestionId).toBeDefined();

    let state = loaded ?? resumed;
    for (let index = 0; index < workflow.questions.length; index += 1) {
      const questionId = state.currentQuestionId ?? workflow.questions[index]?.id;
      if (!questionId) break;
      state = orchestrator.answerCurrentQuestion(state.session.id, defaults[questionId]);
    }

    const preview = orchestrator.calculateLivePreview(state.session.id);
    expect(preview.rankedScores).toHaveLength(2);
    expect(preview.recommendation.winnerOptionId).toBeDefined();

    const result = orchestrator.completeDecision(state.session.id);
    expect(result.workflow.id).toBe(workflow.id);
    expect(result.rankedScores).toHaveLength(2);
    expect(result.risks).toHaveLength(2);
    expect(result.recommendation.winnerOptionId).toBeDefined();
    expect(result.actionPlan.steps.length).toBeGreaterThan(0);
    expect(result.completedAt).toBeDefined();

    const persisted = await orchestrator.saveResult(result);
    expect(persisted.workflowId).toBe(workflow.id);
    expect(repository.storedResults).toHaveLength(1);

    const simulation = orchestrator.simulate(result.session.id, [{ questionId: "monthlyDistance", value: 2400 }]);
    expect(simulation.changedInputs).toHaveLength(1);
    expect(simulation.afterScore).toBeGreaterThanOrEqual(0);
  });

  it("restores saved draft step instead of jumping to the first unanswered question", async () => {
    const repository = createRepository();
    const orchestrator = new DecisionOrchestrator({ repository });
    const workflow = decisionPluginRegistry.getWorkflowBySlug("ev-vs-petrol");
    if (!workflow) throw new Error("workflow missing");

    const started = orchestrator.startDecision(workflow.slug);
    const defaults = createDefaultAnswers(workflow.questions);
    const reviewStep = Math.min(2, workflow.questions.length - 1);
    const reviewQuestionId = workflow.questions[reviewStep]?.id;
    if (!reviewQuestionId) throw new Error("review question missing");

    await repository.saveDraft({
      workflowId: workflow.id,
      pluginId: workflow.pluginId,
      slug: workflow.slug,
      answers: { ...defaults, ...started.session.answers },
      currentStep: reviewStep,
      updatedAt: new Date().toISOString(),
    });

    const loaded = await orchestrator.loadDraft(workflow.id);
    expect(loaded?.currentQuestionId).toBe(reviewQuestionId);
  });
});
