import type { DataStorifiedClient, DecisionRecord } from "./client";

export function listDecisions(client: DataStorifiedClient) {
  return client.decisions.list();
}

export function getDecision(client: DataStorifiedClient, id: string) {
  return client.decisions.get(id);
}

export function saveDecision(client: DataStorifiedClient, decision: DecisionRecord) {
  return client.decisions.save(decision);
}

export function deleteDecision(client: DataStorifiedClient, id: string) {
  return client.decisions.delete(id);
}
