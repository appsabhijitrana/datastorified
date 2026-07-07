import type { DecisionAIAdapter } from "./DecisionAIAdapter";
import type { DecisionAnalyticsAdapter } from "./DecisionAnalyticsAdapter";
import type { DecisionKnowledgeAdapter } from "./DecisionKnowledgeAdapter";
import type { DecisionMemoryAdapter } from "./DecisionMemoryAdapter";
import type { DecisionPersistenceAdapter } from "./DecisionPersistenceAdapter";
import type { DecisionProfileAdapter } from "./DecisionProfileAdapter";
import type { DecisionSyncAdapter } from "./DecisionSyncAdapter";
import { LocalDecisionMemoryAdapter, LocalDecisionPersistenceAdapter, LocalProfileAdapter, NoopSyncAdapter, StaticAIAdapter, StaticKnowledgeAdapter } from "./local";

export type DecisionAdapters = {
  memory: DecisionMemoryAdapter;
  persistence: DecisionPersistenceAdapter;
  profile: DecisionProfileAdapter;
  ai: DecisionAIAdapter;
  knowledge: DecisionKnowledgeAdapter;
  analytics: DecisionAnalyticsAdapter;
  sync: DecisionSyncAdapter;
};

class NoopAnalyticsAdapter implements DecisionAnalyticsAdapter {
  async trackEvent(): Promise<void> {
    // Intentionally empty.
  }
}

const localAdapters: DecisionAdapters = {
  memory: new LocalDecisionMemoryAdapter(),
  persistence: new LocalDecisionPersistenceAdapter(),
  profile: new LocalProfileAdapter(),
  ai: new StaticAIAdapter(),
  knowledge: new StaticKnowledgeAdapter(),
  analytics: new NoopAnalyticsAdapter(),
  sync: new NoopSyncAdapter(),
};

let activeAdapters: DecisionAdapters = localAdapters;

export function getDecisionAdapters(): DecisionAdapters {
  return activeAdapters;
}

export function setDecisionAdapters(next: Partial<DecisionAdapters>): DecisionAdapters {
  activeAdapters = { ...activeAdapters, ...next };
  return activeAdapters;
}

export function resetDecisionAdapters(): DecisionAdapters {
  activeAdapters = localAdapters;
  return activeAdapters;
}

export const decisionAdapters = localAdapters;
