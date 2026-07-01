import { describe, expect, it } from "vitest";
import { LocalDecisionStorage, type StorageLike } from "../storage/localDecisionStorage";
import type { StoredDecision } from "../types";

class TestStorage implements StorageLike {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
}

describe("local decision storage", () => {
  it("saves and loads a decision without requiring browser globals", () => {
    const storage = new LocalDecisionStorage(new TestStorage());
    const decision: StoredDecision = {
      id: "saved-1",
      workflowId: "workspace-choice",
      pluginId: "test-plugin",
      answers: { workStyle: "team" },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    storage.save(decision);
    expect(storage.load(decision.id)).toEqual(decision);
    expect(storage.list()).toEqual([decision]);
    storage.remove(decision.id);
    expect(storage.load(decision.id)).toBeUndefined();
  });

  it("tracks recent, saved, drafts, history, and profile entries locally", () => {
    const storage = new LocalDecisionStorage(new TestStorage());
    const decision: StoredDecision = {
      id: "saved-2",
      workflowId: "workspace-choice",
      pluginId: "test-plugin",
      answers: { workStyle: "team" },
      createdAt: "2026-01-02T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    };

    storage.save(decision);
    storage.saveDraft({ workflowId: decision.workflowId, pluginId: decision.pluginId, answers: decision.answers, step: 3, updatedAt: decision.updatedAt });
    storage.saveProfile({ lastOpenedWorkflow: { workflowId: decision.workflowId, pluginId: decision.pluginId, slug: "workspace-choice", openedAt: decision.updatedAt } });

    expect(storage.listRecent()).toEqual([decision]);
    expect(storage.listSaved()).toEqual([decision]);
    expect(storage.listHistory()).toEqual([decision]);
    expect(storage.getDraft(decision.workflowId)).toMatchObject({ answers: decision.answers, step: 3 });
    expect(storage.getProfile()).toMatchObject({ lastOpenedWorkflow: { workflowId: decision.workflowId, slug: "workspace-choice" } });
  });
});
