import type { DecisionMemoryDraft } from "@datastorified/decision-os";
import type { SyncPayload, SyncSummary } from "@datastorified/sdk";
import type { DecisionRepository } from "./DecisionRepository";
import { CloudDecisionRepositoryImpl, type CloudDecisionRepositoryOptions } from "./CloudDecisionRepository";
import { LocalDecisionRepositoryImpl } from "./LocalDecisionRepository";
import type { DecisionRepositoryDecision, DecisionRepositoryInput } from "./types";

export type HybridDecisionRepositoryOptions = CloudDecisionRepositoryOptions & {
  authenticated?: boolean;
  isCloudAvailable?: boolean;
  localRepository?: DecisionRepository;
  cloudRepository?: DecisionRepository;
};

export class HybridDecisionRepository implements DecisionRepository {
  private readonly localRepository: DecisionRepository;
  private readonly cloudRepository: DecisionRepository;

  constructor(private readonly options: HybridDecisionRepositoryOptions = {}) {
    this.localRepository = options.localRepository ?? new LocalDecisionRepositoryImpl();
    this.cloudRepository = options.cloudRepository ?? new CloudDecisionRepositoryImpl(options);
  }

  private get repository(): DecisionRepository {
    const cloud = this.options.isCloudAvailable !== false && this.options.authenticated;
    return cloud ? this.cloudRepository : this.localRepository;
  }

  async listDecisions() {
    return this.repository.listDecisions();
  }

  async getDecision(id: string) {
    // Always try local first for speed and offline access
    const localDecision = await this.localRepository.getDecision(id);
    if (localDecision) return localDecision;
    return this.repository.getDecision(id);
  }

  async saveDecision(decision: DecisionRepositoryInput) {
    // Save to local first, then to cloud if available
    await this.localRepository.saveDecision(decision);
    if (this.repository !== this.localRepository) {
      try {
        return await this.repository.saveDecision(decision);
      } catch (e) {
        console.warn("Cloud save failed, saved locally", e);
        // an event could be emitted here to notify the user or for later sync
      }
    }
    return decision as DecisionRepositoryDecision;
  }

  async deleteDecision(id: string) {
    await this.localRepository.deleteDecision(id);
    if (this.repository !== this.localRepository) {
      try {
        await this.repository.deleteDecision(id);
      } catch (e) {
        console.warn("Cloud delete failed, deleted locally", e);
      }
    }
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
    await this.localRepository.saveDecisionResult(result);
    if (this.repository !== this.localRepository) {
        try {
            return await this.repository.saveDecisionResult(result);
        } catch (e) {
            console.warn("Cloud saveDecisionResult failed, saved locally", e);
        }
    }
    return result;
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
    await this.localRepository.clearHistory();
    if (this.repository !== this.localRepository) {
        try {
            await this.repository.clearHistory();
        } catch (e) {
            console.warn("Cloud clearHistory failed, cleared locally", e);
        }
    }
  }

  async syncLocalData(payload: SyncPayload): Promise<SyncSummary> {
    if (this.repository === this.localRepository) {
        return {
            decisionsSynced: 0,
            favoritesSynced: 0,
            historySynced: 0,
            profileUpdated: false,
            conflicts: 0,
        }
    }
    return this.repository.syncLocalData(payload);
  }
}
