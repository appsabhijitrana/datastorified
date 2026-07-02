import type { DecisionRepository } from "./DecisionRepository";
import type { DecisionRepositoryDeleteResponse, DecisionRepositoryInput, DecisionRepositoryListResponse, DecisionRepositoryRecordResponse } from "./types";

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export class CloudDecisionRepositoryImpl implements DecisionRepository {
  constructor(private readonly basePath = "/api/decisions") {}

  async listDecisions() {
    const payload = await requestJson<DecisionRepositoryListResponse>(this.basePath);
    return payload.decisions;
  }

  async getDecision(id: string) {
    const payload = await requestJson<DecisionRepositoryRecordResponse>(`${this.basePath}/${encodeURIComponent(id)}`);
    return payload.decision;
  }

  async saveDecision(decision: DecisionRepositoryInput) {
    const payload = await requestJson<DecisionRepositoryRecordResponse>(this.basePath, {
      method: "POST",
      body: JSON.stringify(decision),
    });
    return payload.decision;
  }

  async deleteDecision(id: string) {
    await requestJson<DecisionRepositoryDeleteResponse>(`${this.basePath}/${encodeURIComponent(id)}`, { method: "DELETE" });
  }
}

export const CloudDecisionRepository = CloudDecisionRepositoryImpl;
