import type { DecisionMemoryDraft } from "@datastorified/decision-os";
import type { SyncPayload, SyncSummary } from "@datastorified/sdk";
import type { DecisionRepository } from "./DecisionRepository";
import { CloudDecisionRepositoryImpl, type CloudDecisionRepositoryOptions } from "./CloudDecisionRepository";
import { LocalDecisionRepositoryImpl } from "./LocalDecisionRepository";
import type { DecisionRepositoryDecision, DecisionRepositoryInput } from "./types";

export type HybridDecisionRepositoryOptions = CloudDecisionRepositoryOptions & {
  authenticated?: boolean;
  localRepository?: DecisionRepository;
  cloudRepository?: DecisionRepository;
};

export class HybridDecisionRepositoryImpl implements DecisionRepository {
  private readonly localRepository: DecisionRepository;
  private readonly cloudRepository: DecisionRepository;

  constructor(private readonly options: HybridDecisionRepositoryOptions = {}) {
    this.localRepository = options.localRepository ?? new LocalDecisionRepositoryImpl();
    this.cloudRepository = options.cloudRepository ?? new CloudDecisionRepositoryImpl(options);
  }

  private get repository(): DecisionRepository {
    return this.options.authenticated ? this.cloudRepository : this.localRepository;
  }

  async listDecisions() {
    return this.repository.listDecisions();
  }

  async getDecision(id: string) {
    return this.repository.getDecision(id);
  }

  async saveDecision(decision: DecisionRepositoryInput) {
    return this.repository.saveDecision(decision);
  }

  async deleteDecision(id: string) {
    return this.repository.deleteDecision(id);
  }

  async saveDraft(draft: DecisionMemoryDraft) {
    return this.localRepository.saveDraft(draft);
  }

  async getDraft(workflowId: string) {
    return this.localRepository.getDraft(workflowId);
  }

  async listDrafts() {
    return this.localRepository.listDrafts();
  }

  async updateDraft(draft: DecisionMemoryDraft) {
    return this.localRepository.updateDraft(draft);
  }

  async deleteDraft(workflowId: string) {
    return this.localRepository.deleteDraft(workflowId);
  }

  async saveDecisionResult(result: DecisionRepositoryDecision) {
    return this.repository.saveDecisionResult(result);
  }

  async listDecisionResults() {
    return this.repository.listDecisionResults();
  }

  async saveRecentDecision(result: DecisionRepositoryDecision) {
    return this.localRepository.saveRecentDecision(result);
  }

  async listRecentDecisions() {
    return this.localRepository.listRecentDecisions();
  }

  async clearHistory() {
    return this.localRepository.clearHistory();
  }

  async syncLocalData(payload: SyncPayload): Promise<SyncSummary> {
    return this.repository.syncLocalData(payload);
  }
}

export const HybridDecisionRepository = HybridDecisionRepositoryImpl;
