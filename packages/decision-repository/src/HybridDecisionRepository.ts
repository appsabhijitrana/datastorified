import type { DecisionRepository } from "./DecisionRepository";
import { CloudDecisionRepositoryImpl } from "./CloudDecisionRepository";
import { LocalDecisionRepositoryImpl } from "./LocalDecisionRepository";
import type { DecisionRepositoryInput } from "./types";

export type HybridDecisionRepositoryOptions = {
  authenticated?: boolean;
  localRepository?: DecisionRepository;
  cloudRepository?: DecisionRepository;
};

export class HybridDecisionRepositoryImpl implements DecisionRepository {
  private readonly localRepository: DecisionRepository;
  private readonly cloudRepository: DecisionRepository;

  constructor(private readonly options: HybridDecisionRepositoryOptions = {}) {
    this.localRepository = options.localRepository ?? new LocalDecisionRepositoryImpl();
    this.cloudRepository = options.cloudRepository ?? new CloudDecisionRepositoryImpl();
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
}

export const HybridDecisionRepository = HybridDecisionRepositoryImpl;
