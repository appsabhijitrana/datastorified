import { createDataStorifiedClient, type DecisionRecord, type SyncPayload, type SyncSummary } from "@datastorified/sdk";
import { localDecisionStorage } from "@datastorified/decision-os";
import type { DecisionMemoryDraft } from "@datastorified/decision-os";
import type { DecisionRepositoryDecision } from "./types";
import { resolveDecisionApiBaseUrl } from "./config";

export interface DecisionApiClient {
  saveDraft(draft: DecisionMemoryDraft): Promise<DecisionMemoryDraft>;
  getDraft(workflowId: string): Promise<DecisionMemoryDraft | undefined>;
  listDrafts(): Promise<DecisionMemoryDraft[]>;
  saveDecisionResult(decision: DecisionRepositoryDecision): Promise<DecisionRepositoryDecision>;
  getDecision(id: string): Promise<DecisionRepositoryDecision | undefined>;
  listDecisionResults(): Promise<DecisionRepositoryDecision[]>;
  deleteDecision(id: string): Promise<void>;
  syncLocalData(payload: SyncPayload): Promise<SyncSummary>;
}

export type DecisionApiClientOptions = {
  baseUrl?: string;
  fetcher?: typeof fetch;
};

function toDecisionRepositoryDecision(record: DecisionRecord): DecisionRepositoryDecision {
  return record as DecisionRepositoryDecision;
}

export function createDecisionApiClient(options: DecisionApiClientOptions = {}): DecisionApiClient {
  const client = createDataStorifiedClient({
    baseUrl: resolveDecisionApiBaseUrl({ baseUrl: options.baseUrl }),
    fetcher: options.fetcher,
  });

  return {
    async saveDraft(draft: DecisionMemoryDraft) {
      localDecisionStorage.saveDraft(draft);
      return draft;
    },
    async getDraft(workflowId: string) {
      return localDecisionStorage.getDraft(workflowId);
    },
    async listDrafts() {
      return localDecisionStorage.listDrafts();
    },
    async saveDecisionResult(decision: DecisionRepositoryDecision) {
      const result = await client.decisions.save(decision as DecisionRecord);
      if (!result.ok) throw result.error;
      return toDecisionRepositoryDecision(result.data.decision);
    },
    async listDecisionResults() {
      const result = await client.decisions.list();
      if (!result.ok) throw result.error;
      return result.data.decisions.map(toDecisionRepositoryDecision);
    },
    async getDecision(id: string) {
      const result = await client.decisions.get(id);
      if (!result.ok) throw result.error;
      return toDecisionRepositoryDecision(result.data.decision);
    },
    async deleteDecision(id: string) {
      const result = await client.decisions.delete(id);
      if (!result.ok) throw result.error;
    },
    async syncLocalData(payload: SyncPayload) {
      const result = await client.sync.push(payload);
      if (!result.ok) throw result.error;
      return result.data.summary;
    },
  };
}
