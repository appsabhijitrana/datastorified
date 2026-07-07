import type { SyncEntityBase } from "./types";

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObject);
  if (!value || typeof value !== "object") return value;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));
  return Object.fromEntries(entries.map(([key, entry]) => [key, sortObject(entry)]));
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortObject(value));
}

export function createFingerprint(value: unknown): string {
  const text = stableStringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fp_${(hash >>> 0).toString(36)}`;
}

function parseUpdatedAt(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function preferLatest<T extends { updatedAt: string }>(left: T, right: T): T {
  return parseUpdatedAt(left.updatedAt) >= parseUpdatedAt(right.updatedAt) ? left : right;
}

export function mergeByFingerprintOrLocalId<T extends SyncEntityBase>(local: T[], remote: T[]): T[] {
  const merged = new Map<string, T>();
  const insert = (item: T) => {
    const keys = [item.localId, item.fingerprint].filter(Boolean);
    if (keys.length === 0) return;
    const winner = keys.reduce<T | undefined>((current, key) => {
      const existing = merged.get(key);
      if (!existing) return current ?? item;
      return current ? preferLatest(current, existing) : preferLatest(item, existing);
    }, undefined);
    const next = winner ?? item;
    for (const key of keys) merged.set(key, next);
  };

  for (const item of [...remote, ...local]) insert(item);
  const deduped = [...new Set(merged.values())];
  return deduped.sort((left, right) => parseUpdatedAt(right.updatedAt) - parseUpdatedAt(left.updatedAt));
}
