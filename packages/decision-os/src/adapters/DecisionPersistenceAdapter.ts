import type { StoredDecision } from "../types";

export interface DecisionPersistenceAdapter {
  saveDecision(decision: StoredDecision): Promise<StoredDecision>;
  getDecision(id: string): Promise<StoredDecision | undefined>;
  listDecisions(): Promise<StoredDecision[]>;
  deleteDecision(id: string): Promise<void>;
}
