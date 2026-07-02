import { beforeEach, describe, expect, it } from "vitest";
import { buildDecisionReport, decisionPluginRegistry } from "@datastorified/decision-os";
import { buildDecisionRecord, HybridDecisionRepository, LocalDecisionRepository, type DecisionRepository, type DecisionRepositoryInput } from "../src";

describe("decision repository", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips a local decision record", async () => {
    const workflow = decisionPluginRegistry.getWorkflowBySlug("buy-house");
    if (!workflow) throw new Error("workflow missing");
    const report = buildDecisionReport(workflow, {});
    const repository = new LocalDecisionRepository();
    const saved = await repository.saveDecision(buildDecisionRecord({ workflow, report, answers: {}, id: "decision-1" }));
    const loaded = await repository.getDecision(saved.id);
    expect(loaded?.workflow.slug).toBe("buy-house");
    expect(loaded?.question).toBe(workflow.title);
  });

  it("uses the local repository when anonymous and delegates when authenticated", async () => {
    const local = new LocalDecisionRepository();
    const cloud: DecisionRepository = {
      listDecisions: async () => [{ id: "cloud", pluginId: "p", workflowId: "w" } as never],
      getDecision: async () => undefined,
      saveDecision: async (decision: DecisionRepositoryInput) => decision as never,
      deleteDecision: async () => {},
    };
    const anonymous = new HybridDecisionRepository({ authenticated: false, localRepository: local, cloudRepository: cloud });
    const signedIn = new HybridDecisionRepository({ authenticated: true, localRepository: local, cloudRepository: cloud });

    expect(await anonymous.listDecisions()).toEqual([]);
    await expect(signedIn.listDecisions()).resolves.toHaveLength(1);
  });
});
