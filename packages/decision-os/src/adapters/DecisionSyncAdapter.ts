import type { StoredDecision } from "../types";

export interface DecisionSyncAdapter {
  syncLocalToCloud(payload: { decisions: StoredDecision[] }): Promise<{ syncedCount: number; conflictedIds: string[] }>;
  resolveConflicts<T>(localValue: T, remoteValue: T): Promise<T>;
}
