import { describe, expect, it } from "vitest";
import { DECISION_MEMORY_KEYS, LocalDecisionStorage, type StorageLike } from "../storage/localDecisionStorage";
import type { DecisionMemoryDraft, StoredDecision } from "../types";

class TestStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  dump() {
    return new Map(this.values);
  }
}

class ThrowingStorage implements StorageLike {
  get length() {
    return 0;
  }

  getItem(): string | null {
    throw new Error("storage unavailable");
  }

  setItem(): void {
    throw new Error("storage unavailable");
  }

  removeItem(): void {
    throw new Error("storage unavailable");
  }

  key(): string | null {
    return null;
  }
}

const createDecision = (id: string, updatedAt: string): StoredDecision => ({
  id,
  workflowId: "workspace-choice",
  pluginId: "test-plugin",
  answers: { workStyle: "team" },
  createdAt: updatedAt,
  updatedAt,
});

describe("local decision storage", () => {
  it("stores results, saved decisions, drafts, history, and profile data under the decision keys", () => {
    const backing = new TestStorage();
    const storage = new LocalDecisionStorage(backing);
    const decision = createDecision("decision-1", "2026-01-01T00:00:00.000Z");

    storage.saveResult(decision);
    storage.saveDecision(decision);
    storage.saveDraft({ workflowId: decision.workflowId, pluginId: decision.pluginId, slug: "workspace-choice", answers: decision.answers, currentStep: 3, updatedAt: decision.updatedAt });
    storage.saveProfile({ lastOpenedWorkflow: { workflowId: decision.workflowId, pluginId: decision.pluginId, slug: "workspace-choice", openedAt: decision.updatedAt } });

    expect(backing.dump().has(DECISION_MEMORY_KEYS.recent)).toBe(true);
    expect(backing.dump().has(DECISION_MEMORY_KEYS.saved)).toBe(true);
    expect(backing.dump().has(DECISION_MEMORY_KEYS.drafts)).toBe(true);
    expect(backing.dump().has(DECISION_MEMORY_KEYS.history)).toBe(true);
    expect(backing.dump().has(DECISION_MEMORY_KEYS.profile)).toBe(true);
    expect(storage.listRecent()).toEqual([decision]);
    expect(storage.listSaved()).toEqual([decision]);
    expect(storage.listHistory()).toEqual([decision]);
    expect(storage.getDraft(decision.workflowId)).toMatchObject({ answers: decision.answers, currentStep: 3 });
    expect(storage.getProfile()).toMatchObject({ lastOpenedWorkflow: { workflowId: decision.workflowId, slug: "workspace-choice" } });
  });

  it("keeps recent decisions limited to 20, saved decisions limited to 50, and drafts limited to 10", () => {
    const storage = new LocalDecisionStorage(new TestStorage());

    for (let index = 0; index < 25; index += 1) {
      storage.saveResult(createDecision(`recent-${index}`, `2026-01-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`));
    }

    for (let index = 0; index < 60; index += 1) {
      storage.saveDecision(createDecision(`saved-${index}`, `2026-02-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`));
    }

    for (let index = 0; index < 15; index += 1) {
      const draft: DecisionMemoryDraft = {
        workflowId: `draft-${index}`,
        pluginId: "test-plugin",
        answers: { value: index },
        currentStep: index,
        updatedAt: `2026-03-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
      };
      storage.saveDraft(draft);
    }

    expect(storage.listRecent()).toHaveLength(20);
    expect(storage.listSaved()).toHaveLength(50);
    expect(storage.listDrafts()).toHaveLength(10);
  });

  it("loads from saved, recent, and history collections and supports deleting saved items", () => {
    const storage = new LocalDecisionStorage(new TestStorage());
    const decision = createDecision("decision-2", "2026-01-02T00:00:00.000Z");

    storage.saveResult(decision);
    storage.saveDecision(decision);

    expect(storage.loadDecision(decision.id)).toEqual(decision);
    expect(storage.load(decision.id)).toEqual(decision);
    expect(storage.isSaved(decision.id)).toBe(true);

    storage.deleteSaved(decision.id);
    expect(storage.isSaved(decision.id)).toBe(false);
    expect(storage.listSaved()).toEqual([]);
    expect(storage.loadDecision(decision.id)).toEqual(decision);
  });

  it("falls back to in-memory storage when the provided storage throws", () => {
    const storage = new LocalDecisionStorage(new ThrowingStorage());
    const decision = createDecision("decision-3", "2026-01-03T00:00:00.000Z");

    storage.saveResult(decision);
    storage.saveDecision(decision);
    storage.saveDraft({ workflowId: decision.workflowId, pluginId: decision.pluginId, answers: decision.answers, updatedAt: decision.updatedAt });

    expect(storage.loadDecision(decision.id)).toEqual(decision);
    expect(storage.listSaved()).toEqual([decision]);
    expect(storage.listRecent()).toEqual([decision]);
    expect(storage.getDraft(decision.workflowId)).toMatchObject({ workflowId: decision.workflowId });
  });
});
