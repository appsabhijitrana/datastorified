import type {
  DecisionMemoryDraft,
  DecisionMemoryKeys,
  DecisionMemoryProfile,
  DecisionAnswers,
  StoredDecision,
} from "../types";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;

export const DECISION_MEMORY_KEYS: DecisionMemoryKeys = {
  recent: "ds.decision.recent",
  saved: "ds.decision.saved",
  drafts: "ds.decision.drafts",
  history: "ds.decision.history",
  profile: "ds.decision.profile.local",
};

export const DECISION_MEMORY_LIMITS = {
  recent: 20,
  saved: 50,
  drafts: 10,
} as const;

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }
}

function browserStorage(): StorageLike {
  try {
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  } catch {
    // Some privacy modes expose localStorage but deny access when touched.
  }
  return new MemoryStorage();
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

function isDecisionAnswers(value: unknown): value is DecisionAnswers {
  return isObject(value);
}

function isStoredDecision(value: unknown): value is StoredDecision {
  if (!isObject(value)) return false;
  return typeof value.id === "string"
    && typeof value.workflowId === "string"
    && typeof value.pluginId === "string"
    && isDecisionAnswers(value.answers)
    && typeof value.createdAt === "string"
    && typeof value.updatedAt === "string";
}

function isDraft(value: unknown): value is DecisionMemoryDraft {
  if (!isObject(value)) return false;
  return typeof value.workflowId === "string"
    && typeof value.pluginId === "string"
    && isDecisionAnswers(value.answers)
    && typeof value.updatedAt === "string";
}

function isProfile(value: unknown): value is DecisionMemoryProfile {
  return isObject(value);
}

function readJson<T>(raw: string | null, fallback: T): T {
  if (raw == null || raw === "") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function dedupeById<T extends { id: string }>(items: T[], item: T, limit: number): T[] {
  return [item, ...items.filter((entry) => entry.id !== item.id)].slice(0, limit);
}

function sortByUpdatedAt(items: StoredDecision[]): StoredDecision[] {
  return [...items].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function normalizeDecision(decision: StoredDecision): StoredDecision {
  const timestamp = decision.updatedAt || decision.createdAt || new Date().toISOString();
  return {
    ...decision,
    createdAt: decision.createdAt || timestamp,
    updatedAt: timestamp,
  };
}

function normalizeDraft(draft: DecisionMemoryDraft): DecisionMemoryDraft {
  return {
    ...draft,
    currentStep: typeof draft.currentStep === "number" ? draft.currentStep : draft.step,
    updatedAt: draft.updatedAt || new Date().toISOString(),
  };
}

export class LocalDecisionStorage {
  readonly keys = DECISION_MEMORY_KEYS;
  private readonly fallback = new MemoryStorage();
  private storage: StorageLike;

  constructor(storage: StorageLike = browserStorage()) {
    this.storage = storage;
  }

  saveResult(decision: StoredDecision): void {
    const normalized = normalizeDecision(decision);
    this.writeDecisionCollection("recent", dedupeById(this.readDecisionCollection("recent"), normalized, DECISION_MEMORY_LIMITS.recent));
    this.writeDecisionCollection("history", dedupeById(this.readDecisionCollection("history"), normalized, 100));
  }

  save(decision: StoredDecision): void {
    this.saveResult(decision);
  }

  saveDecision(decision: StoredDecision): void {
    const normalized = normalizeDecision(decision);
    this.writeDecisionCollection("saved", dedupeById(this.readDecisionCollection("saved"), normalized, DECISION_MEMORY_LIMITS.saved));
  }

  isSaved(id: string): boolean {
    return this.readDecisionCollection("saved").some((decision) => decision.id === id);
  }

  load(id: string): StoredDecision | undefined {
    return this.loadDecision(id);
  }

  loadDecision(id: string): StoredDecision | undefined {
    const collections = [this.readDecisionCollection("saved"), this.readDecisionCollection("recent"), this.readDecisionCollection("history")];
    for (const collection of collections) {
      const match = collection.find((decision) => decision.id === id);
      if (match) return match;
    }
    return undefined;
  }

  list(): StoredDecision[] {
    return this.listAllDecisions();
  }

  listAllDecisions(): StoredDecision[] {
    return sortByUpdatedAt([...new Map([...this.readDecisionCollection("recent"), ...this.readDecisionCollection("saved"), ...this.readDecisionCollection("history")].map((decision) => [decision.id, decision])).values()]);
  }

  listRecent(): StoredDecision[] {
    return this.readDecisionCollection("recent");
  }

  listSaved(): StoredDecision[] {
    return this.readDecisionCollection("saved");
  }

  listHistory(): StoredDecision[] {
    return this.readDecisionCollection("history");
  }

  remove(id: string): void {
    this.deleteSaved(id);
    this.writeDecisionCollection("recent", this.readDecisionCollection("recent").filter((decision) => decision.id !== id));
    this.writeDecisionCollection("history", this.readDecisionCollection("history").filter((decision) => decision.id !== id));
  }

  deleteSaved(id: string): void {
    this.writeDecisionCollection("saved", this.readDecisionCollection("saved").filter((decision) => decision.id !== id));
  }

  clear(): void {
    this.writeDecisionCollection("recent", []);
    this.writeDecisionCollection("saved", []);
    this.writeDecisionCollection("history", []);
    this.writeDrafts([]);
    this.writeProfile({});
  }

  saveDraft(draft: DecisionMemoryDraft): boolean {
    const normalized = normalizeDraft(draft);
    const next = dedupeDrafts([normalized, ...this.readDrafts()], DECISION_MEMORY_LIMITS.drafts);
    return this.writeDrafts(next);
  }

  getDraft(workflowId: string): DecisionMemoryDraft | undefined {
    return this.readDrafts().find((entry) => entry.workflowId === workflowId);
  }

  listDrafts(): DecisionMemoryDraft[] {
    return this.readDrafts();
  }

  clearDraft(workflowId: string): boolean {
    return this.writeDrafts(this.readDrafts().filter((entry) => entry.workflowId !== workflowId));
  }

  saveProfile(profile: DecisionMemoryProfile): boolean {
    const merged = { ...this.getProfile(), ...profile, updatedAt: new Date().toISOString() };
    return this.writeProfile(merged);
  }

  getProfile(): DecisionMemoryProfile {
    return this.readProfile();
  }

  private readDecisionCollection(key: "recent" | "saved" | "history"): StoredDecision[] {
    const value = this.readValue<unknown>(this.keys[key], []);
    if (!Array.isArray(value) || !value.every((item) => isStoredDecision(item))) return [];
    return sortByUpdatedAt(value);
  }

  private writeDecisionCollection(key: "recent" | "saved" | "history", decisions: StoredDecision[]): boolean {
    return this.writeValue(this.keys[key], decisions);
  }

  private readDrafts(): DecisionMemoryDraft[] {
    const value = this.readValue<unknown>(this.keys.drafts, []);
    if (!Array.isArray(value) || !value.every((item) => isDraft(item))) return [];
    return value.map(normalizeDraft);
  }

  private writeDrafts(drafts: DecisionMemoryDraft[]): boolean {
    return this.writeValue(this.keys.drafts, drafts.slice(0, DECISION_MEMORY_LIMITS.drafts));
  }

  private readProfile(): DecisionMemoryProfile {
    const value = this.readValue<unknown>(this.keys.profile, {});
    return isProfile(value) ? value : {};
  }

  private writeProfile(profile: DecisionMemoryProfile): boolean {
    return this.writeValue(this.keys.profile, profile);
  }

  private readValue<T>(key: string, fallback: T): T {
    try {
      const raw = this.storage.getItem(key);
      return readJson(raw, fallback);
    } catch {
      this.storage = this.fallback;
      return readJson(this.storage.getItem(key), fallback);
    }
  }

  private writeValue<T>(key: string, value: T): boolean {
    try {
      this.storage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      this.storage = this.fallback;
      try {
        this.storage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    }
  }
}

function dedupeDrafts(items: DecisionMemoryDraft[], limit: number): DecisionMemoryDraft[] {
  const seen = new Set<string>();
  const result: DecisionMemoryDraft[] = [];
  for (const item of items) {
    if (seen.has(item.workflowId)) continue;
    seen.add(item.workflowId);
    result.push(item);
    if (result.length >= limit) break;
  }
  return result;
}

export const localDecisionStorage = new LocalDecisionStorage();
