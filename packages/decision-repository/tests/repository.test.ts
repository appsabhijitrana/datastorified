import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildDecisionReport, decisionPluginRegistry, DECISION_MEMORY_KEYS, type DecisionMemoryDraft } from "@datastorified/decision-os";
import type { SyncPayload } from "@datastorified/sdk";
import { buildDecisionRecord, HybridDecisionRepository, LocalDecisionRepository, type DecisionApiClient, type DecisionRepositoryDecision } from "../src";

function createDecision() {
  const workflow = decisionPluginRegistry.getWorkflowBySlug("buy-house");
  if (!workflow) throw new Error("workflow missing");
  const report = buildDecisionReport(workflow, {});
  return buildDecisionRecord({ workflow, report, answers: {}, id: "decision-1" });
}

describe("decision repository", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips a local decision record", async () => {
    const repository = new LocalDecisionRepository();
    const decision = createDecision();
    const saved = await repository.saveDecision(decision);
    const loaded = await repository.getDecision(saved.id);
    expect(loaded?.workflow.slug).toBe("buy-house");
    expect(loaded?.question).toBe(saved.question);
  });

  it("uses the local repository when anonymous", async () => {
    const repository = new HybridDecisionRepository({ authenticated: false });
    const decision = createDecision();
    await repository.saveDecision(decision);
    expect(await repository.listDecisions()).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(DECISION_MEMORY_KEYS.saved) ?? "{}")).toMatchObject({ version: 1 });
  });

  it("uses the cloud repository when authenticated", async () => {
    const apiClient: DecisionApiClient = {
      saveDraft: vi.fn(async (draft: DecisionMemoryDraft) => draft),
      getDraft: vi.fn(async () => undefined),
      listDrafts: vi.fn(async () => []),
      saveDecisionResult: vi.fn(async (decision: DecisionRepositoryDecision) => ({ ...decision, id: "cloud-decision" })),
      getDecision: vi.fn(async () => undefined),
      listDecisionResults: vi.fn(async () => [{ ...createDecision(), id: "cloud-decision" }]),
      deleteDecision: vi.fn(async () => {}),
      syncLocalData: vi.fn(async () => ({ decisionsSynced: 0, favoritesSynced: 0, historySynced: 0, profileUpdated: false, conflicts: 0 })),
    };
    const repository = new HybridDecisionRepository({ authenticated: true, apiClient });

    const decision = createDecision();
    const saved = await repository.saveDecisionResult(decision);
    const listed = await repository.listDecisions();

    expect(saved.id).toBe("cloud-decision");
    expect(listed).toHaveLength(1);
    expect(apiClient.saveDecisionResult).toHaveBeenCalledOnce();
    expect(apiClient.listDecisionResults).toHaveBeenCalledOnce();
  });

  it("falls back to local persistence when the cloud client fails", async () => {
    const failingApiClient: DecisionApiClient = {
      saveDraft: vi.fn(async (draft: DecisionMemoryDraft) => draft),
      getDraft: vi.fn(async () => undefined),
      listDrafts: vi.fn(async () => []),
      saveDecisionResult: vi.fn(async () => { throw new Error("cloud down"); }),
      getDecision: vi.fn(async () => { throw new Error("cloud down"); }),
      listDecisionResults: vi.fn(async () => { throw new Error("cloud down"); }),
      deleteDecision: vi.fn(async () => { throw new Error("cloud down"); }),
      syncLocalData: vi.fn(async () => { throw new Error("cloud down"); }),
    };
    const repository = new HybridDecisionRepository({ authenticated: true, apiClient: failingApiClient });
    const decision = createDecision();

    await repository.saveDecision(decision);
    expect(await repository.listDecisions()).toHaveLength(1);
    expect(await repository.getDecision(decision.id)).toMatchObject({ id: decision.id });
  });

  it("keeps drafts local and uses the sync method when asked", async () => {
    const syncLocalData = vi.fn(async (payload: SyncPayload) => {
      void payload;
      return { decisionsSynced: 2, favoritesSynced: 1, historySynced: 3, profileUpdated: true, conflicts: 0 };
    });
    const apiClient: DecisionApiClient = {
      saveDraft: vi.fn(async (draft: DecisionMemoryDraft) => draft),
      getDraft: vi.fn(async (workflowId: string) => localStorage.getItem(`draft:${workflowId}`) ? ({ workflowId, pluginId: "finance", answers: {}, updatedAt: new Date().toISOString() }) : undefined),
      listDrafts: vi.fn(async () => []),
      saveDecisionResult: vi.fn(async (decision: DecisionRepositoryDecision) => decision),
      getDecision: vi.fn(async () => undefined),
      listDecisionResults: vi.fn(async () => []),
      deleteDecision: vi.fn(async () => {}),
      syncLocalData,
    };
    const repository = new HybridDecisionRepository({ authenticated: true, apiClient });
    const draft: DecisionMemoryDraft = {
      workflowId: "workflow-1",
      pluginId: "finance",
      answers: { value: "yes" },
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    await repository.saveDraft(draft);
    expect(await repository.getDraft("workflow-1")).toMatchObject(draft);
    expect(await repository.listDrafts()).toHaveLength(1);

    await repository.syncLocalData({
      decisions: [],
      favorites: [],
      history: [],
      profile: null,
    });

    expect(syncLocalData).toHaveBeenCalledOnce();
    expect(JSON.parse(localStorage.getItem(DECISION_MEMORY_KEYS.drafts) ?? "{}")).toMatchObject({ version: 1 });
  });
});
