import type { StoredDecision } from "../types";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;

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

export class LocalDecisionStorage {
  constructor(private readonly storage: StorageLike = browserStorage(), private readonly prefix = "datastorified:decision-os:") {}

  save(decision: StoredDecision): void {
    this.storage.setItem(this.key(decision.id), JSON.stringify(decision));
  }

  load(id: string): StoredDecision | undefined {
    const raw = this.storage.getItem(this.key(id));
    if (!raw) return undefined;
    try {
      const parsed: unknown = JSON.parse(raw);
      return isStoredDecision(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  list(): StoredDecision[] {
    const decisions: StoredDecision[] = [];
    for (let index = 0; index < this.storage.length; index += 1) {
      const key = this.storage.key(index);
      if (!key?.startsWith(this.prefix)) continue;
      const decision = this.load(key.slice(this.prefix.length));
      if (decision) decisions.push(decision);
    }
    return decisions.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  remove(id: string): void {
    this.storage.removeItem(this.key(id));
  }

  clear(): void {
    const ids = this.list().map(({ id }) => id);
    for (const id of ids) this.remove(id);
  }

  private key(id: string): string {
    return `${this.prefix}${id}`;
  }
}

export const localDecisionStorage = new LocalDecisionStorage();
