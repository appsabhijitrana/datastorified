import type { DecisionMemoryDraft } from "@datastorified/decision-os";
import type { SyncPayload, SyncSummary } from "@datastorified/sdk";
import { decisionPluginRegistry } from "@datastorified/decision-os";
import type { DecisionRepository } from "./DecisionRepository";
import { normalizeDecision } from "./DecisionRepository";
import type { DecisionRepositoryDecision, DecisionRepositoryInput } from "./types";
import { createDecisionApiClient, type DecisionApiClient, type DecisionApiClientOptions } from "./DecisionApiClient";
import { LocalDecisionRepositoryImpl } from "./LocalDecisionRepository";

export type CloudDecisionRepositoryOptions = DecisionApiClientOptions & {
  apiClient?: DecisionApiClient;
  localRepository?: DecisionRepository;
};

function enrich(decision: DecisionRepositoryDecision | undefined): DecisionRepositoryDecision | undefined {
  if (!decision) return undefined;
  const workflow = decisionPluginRegistry.getWorkflow(decision.workflowId)
    ?? ("workflow" in decision ? decisionPluginRegistry.getWorkflowBySlug(decision.workflow.slug) : undefined);
  if (!workflow) return decision;
  return normalizeDecision({
    ...decision,
    workflow,
    plugin: decision.plugin ?? decisionPluginRegistry.getPlugin(workflow.pluginId) ?? undefined,
    question: decision.question ?? workflow.title,
    assumptions: decision.assumptions?.length ? decision.assumptions : workflow.assumptions ?? [],
  });
}

function fallbackDecisionList(localRepository: DecisionRepository) {
  return localRepository.listDecisions();
}

export class CloudDecisionRepositoryImpl implements DecisionRepository {
  private readonly apiClient: DecisionApiClient;
  private readonly localRepository: DecisionRepository;

  constructor(options: CloudDecisionRepositoryOptions = {}) {
    this.apiClient = options.apiClient ?? createDecisionApiClient(options);
    this.localRepository = options.localRepository ?? new LocalDecisionRepositoryImpl();
  }

  async listDecisions() {
    try {
      return (await this.apiClient.listDecisionResults()).map((item) => enrich(item) ?? item);
    } catch {
      return fallbackDecisionList(this.localRepository);
    }
  }

  async getDecision(id: string) {
    try {
      return enrich(await this.apiClient.getDecision(id));
    } catch {
      return this.localRepository.getDecision(id);
    }
  }

  async saveDecision(decision: DecisionRepositoryInput) {
    try {
      const saved = await this.apiClient.saveDecisionResult(normalizeDecision(decision));
      await this.localRepository.saveDecision(saved);
      return saved;
    } catch {
      return this.localRepository.saveDecision(decision);
    }
  }

  async deleteDecision(id: string) {
    try {
      await this.apiClient.deleteDecision(id);
    } catch {
      // The local copy remains the safe fallback if the cloud path is unavailable.
    }
    await this.localRepository.deleteDecision(id);
  }

  async saveDraft(draft: DecisionMemoryDraft) {
    return this.apiClient.saveDraft(draft);
  }

  async getDraft(workflowId: string) {
    return this.apiClient.getDraft(workflowId);
  }

  async listDrafts() {
    return this.apiClient.listDrafts();
  }

  async updateDraft(draft: DecisionMemoryDraft) {
    return this.apiClient.saveDraft(draft);
  }

  async deleteDraft(workflowId: string) {
    await this.localRepository.deleteDraft(workflowId);
  }

  async saveDecisionResult(result: DecisionRepositoryDecision) {
    try {
      const saved = await this.apiClient.saveDecisionResult(result);
      await this.localRepository.saveDecision(saved);
      return saved;
    } catch {
      return this.localRepository.saveDecisionResult(result);
    }
  }

  async listDecisionResults() {
    try {
      return (await this.apiClient.listDecisionResults()).map((item) => enrich(item) ?? item);
    } catch {
      return this.localRepository.listDecisionResults();
    }
  }

  async saveRecentDecision(result: DecisionRepositoryDecision) {
    return this.localRepository.saveRecentDecision(result);
  }

  async listRecentDecisions() {
    return this.localRepository.listRecentDecisions();
  }

  async clearHistory() {
    await this.localRepository.clearHistory();
  }

  async syncLocalData(payload: SyncPayload): Promise<SyncSummary> {
    try {
      return await this.apiClient.syncLocalData(payload);
    } catch {
      return this.localRepository.syncLocalData(payload);
    }
  }
}

export const CloudDecisionRepository = CloudDecisionRepositoryImpl;
