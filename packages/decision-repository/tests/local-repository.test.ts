import { beforeEach, describe, expect, it } from "vitest";
import { buildDecisionReport, decisionPluginRegistry, DECISION_MEMORY_KEYS, type DecisionMemoryDraft } from "@datastorified/decision-os";
import { LocalDecisionRepository } from "../src";

describe("local decision repository", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves, updates, deletes, and lists drafts", async () => {
    const workflow = decisionPluginRegistry.getWorkflowBySlug("buy-house");
    if (!workflow) throw new Error("workflow missing");
    const repository = new LocalDecisionRepository();
    const draft: DecisionMemoryDraft = {
      workflowId: workflow.id,
      pluginId: workflow.pluginId,
      slug: workflow.slug,
      answers: { price: 1200000 },
      currentStep: 1,
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    await repository.saveDraft(draft);
    await repository.updateDraft({ ...draft, currentStep: 2, answers: { price: 1300000 } });

    const loaded = await repository.getDraft(workflow.id);
    expect(loaded).toMatchObject({ workflowId: workflow.id, currentStep: 2, answers: { price: 1300000 } });
    expect(await repository.listDrafts()).toHaveLength(1);

    const stored = JSON.parse(localStorage.getItem(DECISION_MEMORY_KEYS.drafts) ?? "{}");
    expect(stored).toMatchObject({ version: 1 });

    await repository.deleteDraft(workflow.id);
    expect(await repository.getDraft(workflow.id)).toBeUndefined();
    expect(await repository.listDrafts()).toHaveLength(0);
  });

  it("saves decision results, recent decisions, and clears history without mutating saved items", async () => {
    const workflow = decisionPluginRegistry.getWorkflowBySlug("buy-house");
    if (!workflow) throw new Error("workflow missing");
    const report = buildDecisionReport(workflow, {});
    const repository = new LocalDecisionRepository();
    const decision = {
      id: "decision-1",
      pluginId: workflow.pluginId,
      workflowId: workflow.id,
      plugin: decisionPluginRegistry.getPlugin(workflow.pluginId) ?? {
        id: workflow.pluginId,
        name: workflow.pluginId,
        version: "1",
        categories: [workflow.category ?? workflow.pluginId],
        keywords: workflow.intent.keywords,
        relatedCalculators: workflow.relatedCalculators ?? [],
        relatedTools: workflow.relatedTools ?? [],
        knowledgeAssumptions: [],
        workflows: [workflow],
      },
      workflow,
      question: workflow.title,
      answers: {},
      score: report.score,
      confidence: Math.round(report.score.percentage),
      riskLevel: report.risks[0]?.severity ?? "low",
      recommendation: report.recommendation ?? workflow.recommendations[0],
      actionPlan: report.actionPlan,
      assumptions: workflow.assumptions ?? [],
      report,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as const;

    await repository.saveDecisionResult(decision);
    expect(await repository.getDecisionResult(decision.id)).toMatchObject({ id: decision.id, workflowId: workflow.id });
    expect(await repository.listDecisionResults()).toHaveLength(1);
    expect(await repository.listRecentDecisions()).toHaveLength(1);

    const stored = JSON.parse(localStorage.getItem(DECISION_MEMORY_KEYS.recent) ?? "{}");
    expect(stored).toMatchObject({ version: 1, data: expect.any(Array) });

    await repository.saveRecentDecision({ ...decision, id: "decision-2" });
    expect(await repository.listRecentDecisions()).toHaveLength(2);

    await repository.clearHistory();
    expect(await repository.listRecentDecisions()).toHaveLength(0);
    expect(await repository.listDecisionResults()).toHaveLength(0);
  });
});
