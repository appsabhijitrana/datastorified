import { describe, expect, it } from "vitest";
import { LocalProfileStorage, type StorageLike } from "../src/storage/localProfileStorage";

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
    throw new Error("unavailable");
  }

  setItem(): void {
    throw new Error("unavailable");
  }

  removeItem(): void {
    throw new Error("unavailable");
  }

  key(): string | null {
    return null;
  }
}

describe("local profile storage", () => {
  it("stores and loads the nested profile envelope", () => {
    const storage = new LocalProfileStorage(new TestStorage());

    expect(storage.saveProfile({ monthlyIncome: 75000, preferredCurrency: "INR" })).toBe(true);
    expect(storage.getCurrentProfile()).toMatchObject({ monthlyIncome: 75000, preferredCurrency: "INR" });
    expect(storage.saveEnvelope({ lastOpenedWorkflow: { workflowId: "wf", pluginId: "plugin", slug: "slug", openedAt: "2026-01-01T00:00:00.000Z" } })).toBe(true);
    expect(storage.getProfile()).toMatchObject({ lastOpenedWorkflow: { workflowId: "wf", slug: "slug" }, profile: { monthlyIncome: 75000, preferredCurrency: "INR" } });
  });

  it("falls back gracefully when browser storage throws", () => {
    const storage = new LocalProfileStorage(new ThrowingStorage());

    expect(storage.saveProfile({ country: "India", cloudHistoryCount: 2 })).toBe(true);
    expect(storage.getCurrentProfile()).toMatchObject({ country: "India", cloudHistoryCount: 2 });
  });
});
