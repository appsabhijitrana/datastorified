import type { DecisionProfile, DecisionProfileEnvelope } from "../types";
import { decisionProfileEnvelopeSchema } from "../schema";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;

export const PROFILE_STORAGE_KEY = "ds.decision.profile.local";

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
    // Some privacy modes deny direct localStorage access.
  }
  return new MemoryStorage();
}

function readJson<T>(raw: string | null, fallback: T): T {
  if (raw == null || raw === "") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

function normalizeEnvelope(value: DecisionProfileEnvelope): DecisionProfileEnvelope {
  return {
    ...value,
    updatedAt: value.updatedAt || value.profile?.updatedAt || new Date().toISOString(),
    profile: value.profile ? { ...value.profile, updatedAt: value.profile.updatedAt || new Date().toISOString() } : value.profile,
  };
}

export class LocalProfileStorage {
  readonly key = PROFILE_STORAGE_KEY;
  private readonly fallback = new MemoryStorage();
  private storage: StorageLike;

  constructor(storage: StorageLike = browserStorage()) {
    this.storage = storage;
  }

  getProfile(): DecisionProfileEnvelope {
    const raw = this.readValue<unknown>(this.key, {});
    if (!isObject(raw)) return {};
    const parsed = decisionProfileEnvelopeSchema.safeParse(raw);
    return parsed.success ? parsed.data : {};
  }

  getCurrentProfile(): DecisionProfile | undefined {
    return this.getProfile().profile;
  }

  saveProfile(profile: Partial<DecisionProfile>): boolean {
    const current = this.getProfile();
    const next: DecisionProfileEnvelope = normalizeEnvelope({
      ...current,
      profile: {
        ...(current.profile ?? {}),
        ...profile,
        updatedAt: new Date().toISOString(),
      },
    });
    return this.writeValue(this.key, next);
  }

  saveEnvelope(envelope: DecisionProfileEnvelope): boolean {
    const current = this.getProfile();
    const next: DecisionProfileEnvelope = normalizeEnvelope({
      ...current,
      ...envelope,
      profile: {
        ...(current.profile ?? {}),
        ...(envelope.profile ?? {}),
      },
    });
    return this.writeValue(this.key, next);
  }

  clearProfile(): boolean {
    return this.writeValue(this.key, {});
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

export const localProfileStorage = new LocalProfileStorage();
