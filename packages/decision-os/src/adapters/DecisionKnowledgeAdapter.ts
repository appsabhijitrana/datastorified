import type { DecisionWorkflow } from "../types";

export interface DecisionKnowledgeAdapter {
  getAssumptions(workflow?: DecisionWorkflow | { id?: string; slug?: string; category?: string }): Promise<string[]>;
  getMarketData(query?: { symbol?: string; category?: string }): Promise<Record<string, unknown>>;
  getRates(query?: { region?: string; kind?: string }): Promise<Record<string, number>>;
}
