import { createDataStorifiedClient, type DecisionRecord } from "@datastorified/sdk";
import type { DecisionRepository } from "./DecisionRepository";
import { normalizeDecision } from "./DecisionRepository";
import type { DecisionRepositoryInput } from "./types";
import { LocalDecisionRepositoryImpl } from "./LocalDecisionRepository";

const localRepository = new LocalDecisionRepositoryImpl();

function toDecisionInput(record: DecisionRecord): DecisionRepositoryInput {
  return record as DecisionRepositoryInput;
}

export class CloudDecisionRepositoryImpl implements DecisionRepository {
  private readonly client;

  constructor() {
    this.client = createDataStorifiedClient();
  }

  private async fallbackList() {
    return localRepository.listDecisions();
  }

  private async fallbackGet(id: string) {
    return localRepository.getDecision(id);
  }

  private async fallbackSave(decision: DecisionRepositoryInput) {
    return localRepository.saveDecision(decision);
  }

  async listDecisions() {
    const result = await this.client.decisions.list();
    if (!result.ok) return this.fallbackList();
    return result.data.decisions.map((item) => normalizeDecision(toDecisionInput(item)));
  }

  async getDecision(id: string) {
    const result = await this.client.decisions.get(id);
    if (!result.ok) return this.fallbackGet(id);
    return normalizeDecision(toDecisionInput(result.data.decision));
  }

  async saveDecision(decision: DecisionRepositoryInput) {
    const result = await this.client.decisions.save(decision as DecisionRecord);
    if (!result.ok) return this.fallbackSave(decision);
    return normalizeDecision(toDecisionInput(result.data.decision));
  }

  async deleteDecision(id: string) {
    const result = await this.client.decisions.delete(id);
    if (!result.ok) {
      await localRepository.deleteDecision(id);
      return;
    }
    await localRepository.deleteDecision(id);
  }
}

export const CloudDecisionRepository = CloudDecisionRepositoryImpl;
