import { preferLatest } from "./merge";

export type SyncConflictResolution<T> = {
  winner: T;
  loser: T;
  reason: "local-newer" | "cloud-newer" | "same-time";
};

function updatedAt(value: { updatedAt: string }): number {
  const parsed = Date.parse(value.updatedAt);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function resolveSyncConflict<T extends { updatedAt: string }>(localValue: T, cloudValue: T): SyncConflictResolution<T> {
  const localTime = updatedAt(localValue);
  const cloudTime = updatedAt(cloudValue);
  if (localTime > cloudTime) return { winner: localValue, loser: cloudValue, reason: "local-newer" };
  if (cloudTime > localTime) return { winner: cloudValue, loser: localValue, reason: "cloud-newer" };
  return { winner: preferLatest(localValue, cloudValue), loser: preferLatest(cloudValue, localValue), reason: "same-time" };
}
