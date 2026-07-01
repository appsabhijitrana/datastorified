import type { DecisionAnswers, StoredDecision } from "../types";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;

export type DecisionMemoryDraft = {
  workflowId: string;
  pluginId: string;
  answers: DecisionAnswers;
  step?: number;
  updatedAt: string;
};

export type DecisionMemoryProfile = {
  lastOpenedWorkflow?: {
    workflowId: string;
    pluginId: string;
    slug: string;
    openedAt: string;
  };
};

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();
  get length(): number { return this.values.size; }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
}

function browserStorage(): StorageLike {
  try {
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  } catch {
    // Privacy modes can expose localStorage while denying access to it.
  }
  return new MemoryStorage();
}

function isStoredDecision(value: unknown): value is StoredDecision {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StoredDecision>;
  return typeof candidate.id === "string" && typeof candidate.workflowId === "string" && typeof candidate.pluginId === "string" && typeof candidate.createdAt === "string" && typeof candidate.updatedAt === "string" && Boolean(candidate.answers && typeof candidate.answers === "object");
}

function isDraft(value: unknown): value is DecisionMemoryDraft {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<DecisionMemoryDraft>;
  return typeof candidate.workflowId === "string" && typeof candidate.pluginId === "string" && Boolean(candidate.answers && typeof candidate.answers === "object") && typeof candidate.updatedAt === "string";
}

function isProfile(value: unknown): value is DecisionMemoryProfile {
  return Boolean(value && typeof value === "object");
}

function isStoredDecisionArray(value: unknown): value is StoredDecision[] {
  return Array.isArray(value) && value.every((item) => isStoredDecision(item));
}

function isDraftArray(value: unknown): value is DecisionMemoryDraft[] {
  return Array.isArray(value) && value.every((item) => isDraft(item));
}

function upsertDecision(items: StoredDecision[], item: StoredDecision, limit: number): StoredDecision[] {
  return [item, ...items.filter((entry) => entry.id !== item.id)].slice(0, limit);
}

function sortDecisions(items: StoredDecision[]): StoredDecision[] {
  return [...items].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export class LocalDecisionStorage {
  private readonly keys = {
    recent: "ds.decision.recent",
    saved: "ds.decision.saved",
    drafts: "ds.decision.drafts",
    history: "ds.decision.history",
    profile: "ds.decision.profile.local",
  } as const;

  constructor(private readonly storage: StorageLike = browserStorage()) {}

  save(decision: StoredDecision): void {
    const normalized = { ...decision, updatedAt: decision.updatedAt || new Date().toISOString(), createdAt: decision.createdAt || decision.updatedAt || new Date().toISOString() };
    this.writeCollection("recent", upsertDecision(this.readDecisions("recent"), normalized, 20));
    this.writeCollection("history", upsertDecision(this.readDecisions("history"), normalized, 100));
    this.writeCollection("saved", upsertDecision(this.readDecisions("saved"), normalized, 50));
  }

  load(id: string): StoredDecision | undefined {
    return this.mergeDecisions().find((decision) => decision.id === id);
  }

  list(): StoredDecision[] {
    return this.mergeDecisions();
  }

  listRecent(): StoredDecision[] {
    return this.readDecisions("recent");
  }

  listSaved(): StoredDecision[] {
    return this.readDecisions("saved");
  }

  listHistory(): StoredDecision[] {
    return this.readDecisions("history");
  }

  remove(id: string): void {
    const recent = this.readDecisions("recent").filter((decision) => decision.id !== id);
    const saved = this.readDecisions("saved").filter((decision) => decision.id !== id);
    const history = this.readDecisions("history").filter((decision) => decision.id !== id);
    this.writeCollection("recent", recent);
    this.writeCollection("saved", saved);
    this.writeCollection("history", history);
  }

  clear(): void {
    this.writeCollection("recent", []);
    this.writeCollection("saved", []);
    this.writeCollection("history", []);
    this.writeCollection("drafts", []);
    this.writeValue("profile", {});
  }

  saveDraft(draft: DecisionMemoryDraft): boolean {
    const drafts = this.readDrafts();
    const next = [draft, ...drafts.filter((entry) => entry.workflowId !== draft.workflowId)].slice(0, 10);
    return this.writeValue("drafts", next);
  }

  getDraft(workflowId: string): DecisionMemoryDraft | undefined {
    return this.readDrafts().find((entry) => entry.workflowId === workflowId);
  }

  listDrafts(): DecisionMemoryDraft[] {
    return this.readDrafts();
  }

  clearDraft(workflowId: string): boolean {
    return this.writeValue("drafts", this.readDrafts().filter((entry) => entry.workflowId !== workflowId));
  }

  saveProfile(profile: DecisionMemoryProfile): boolean {
    return this.writeValue("profile", { ...(this.getProfile() ?? {}), ...profile });
  }

  getProfile(): DecisionMemoryProfile {
    return this.readValue<DecisionMemoryProfile>("profile", {});
  }

  private mergeDecisions(): StoredDecision[] {
    const recent = this.readDecisions("recent");
    const saved = this.readDecisions("saved");
    const history = this.readDecisions("history");
    return sortDecisions([...new Map([...recent, ...saved, ...history].map((decision) => [decision.id, decision])).values()]);
  }

  private readDecisions(key: "recent" | "saved" | "history"): StoredDecision[] {
    const value = this.readValue<unknown>(key, []);
    return isStoredDecisionArray(value) ? sortDecisions(value) : [];
  }

  private writeCollection(key: "recent" | "saved" | "history", decisions: StoredDecision[]): boolean {
    return this.writeValue(key, decisions);
  }

  private readDrafts(): DecisionMemoryDraft[] {
    const value = this.readValue<unknown>("drafts", []);
    return isDraftArray(value) ? value : [];
  }

  private readValue<T>(key: keyof typeof this.keys, fallback: T): T {
    try {
      const raw = this.storage.getItem(this.key(key));
      if (raw == null || raw === "") return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private writeValue<T>(key: keyof typeof this.keys, value: T): boolean {
    try {
      this.storage.setItem(this.key(key), JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  private key(key: keyof typeof this.keys): string {
    return this.keys[key];
  }
}

export const localDecisionStorage = new LocalDecisionStorage();
