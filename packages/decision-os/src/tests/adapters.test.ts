import { describe, expect, it } from "vitest";
import { buildDecisionReport, createDefaultAnswers, decisionPluginRegistry } from "../index";
import { getDecisionAdapters, resetDecisionAdapters } from "../adapters";
import { financeDecisionWorkflows } from "../plugins/finance/workflows";

describe("decision adapters", () => {
  it("exposes local adapter implementations by default", async () => {
    resetDecisionAdapters();
    const adapters = getDecisionAdapters();
    const workflow = financeDecisionWorkflows[0];
    const answers = createDefaultAnswers(workflow.questions);
    const report = buildDecisionReport(workflow, answers);

    await adapters.profile.updateProfile({ preferredCurrency: "INR", monthlyIncome: 100000 });
    const profile = await adapters.profile.getProfile();
    expect(profile.profile?.preferredCurrency).toBe("INR");
    expect(await adapters.profile.getCompleteness()).toMatchObject({ score: expect.any(Number) });

    await adapters.persistence.saveDecision({ id: "decision-1", workflowId: workflow.id, pluginId: workflow.pluginId, answers, report, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" });
    expect(await adapters.persistence.getDecision("decision-1")).toMatchObject({ id: "decision-1" });
    expect(await adapters.persistence.listDecisions()).toHaveLength(1);

    await adapters.memory.saveResult({ id: "decision-2", workflowId: workflow.id, pluginId: workflow.pluginId, answers, report, createdAt: "2026-01-02T00:00:00.000Z", updatedAt: "2026-01-02T00:00:00.000Z" });
    expect(await adapters.memory.listRecent()).toHaveLength(1);

    const explanation = await adapters.ai.explainDecision(report);
    expect(explanation.length).toBeGreaterThan(0);
    expect(await adapters.knowledge.getAssumptions(workflow)).toEqual(workflow.assumptions ?? []);

    expect(decisionPluginRegistry.getWorkflow(workflow.id)).toBeDefined();
  });
});
