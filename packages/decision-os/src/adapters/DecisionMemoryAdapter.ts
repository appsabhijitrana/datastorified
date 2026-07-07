import type { DecisionMemoryDraft, DecisionMemoryProfile, StoredDecision } from "../types";

export interface DecisionMemoryAdapter {
  listRecent(): Promise<StoredDecision[]>;
  listSaved(): Promise<StoredDecision[]>;
  listHistory(): Promise<StoredDecision[]>;
  saveResult(decision: StoredDecision): Promise<void>;
  saveDecision(decision: StoredDecision): Promise<void>;
  loadDecision(id: string): Promise<StoredDecision | undefined>;
  deleteSaved(id: string): Promise<void>;
  clear(id?: string): Promise<void>;
  getDraft(workflowId: string): Promise<DecisionMemoryDraft | undefined>;
  saveDraft(draft: DecisionMemoryDraft): Promise<boolean>;
  clearDraft(workflowId: string): Promise<boolean>;
  listDrafts(): Promise<DecisionMemoryDraft[]>;
  getProfile(): Promise<DecisionMemoryProfile>;
  saveProfile(profile: DecisionMemoryProfile): Promise<boolean>;
}
