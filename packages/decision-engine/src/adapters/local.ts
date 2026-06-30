import type { DecisionAIAdapter } from "./DecisionAIAdapter";
import type { DecisionKnowledgeAdapter } from "./DecisionKnowledgeAdapter";
import type { DecisionPersistenceAdapter } from "./DecisionPersistenceAdapter";
import type { DecisionAnalysis, StoredDecision } from "../types";
import { decisionStorage } from "../storage/decisionStorage";

export class LocalDecisionPersistenceAdapter implements DecisionPersistenceAdapter {
  async saveDecision(decision: StoredDecision) { decisionStorage.save(decision); }
  async getDecision(id: string) { return decisionStorage.get(id); }
  async listDecisions() { return decisionStorage.listSaved(); }
  async deleteDecision(id: string) { decisionStorage.remove(id); }
  async syncLocalDecisions(decisions: StoredDecision[]) { decisions.forEach((decision) => decisionStorage.save(decision)); return decisionStorage.listSaved(); }
}
export class StaticExplanationAdapter implements DecisionAIAdapter {
  async explainDecision(analysis: DecisionAnalysis) { return analysis.recommendation.summary; }
  async generateActionPlan(analysis: DecisionAnalysis) { return analysis.recommendation.actionPlan; }
  async answerFollowUpQuestion(_question: string, analysis: DecisionAnalysis) { return `Review ${analysis.recommendation.nextBestAction.toLocaleLowerCase()} and rerun the scenario with a conservative assumption.`; }
}
export class StaticKnowledgeAdapter implements DecisionKnowledgeAdapter {
  async getMarketData(_topic: string) { return {}; }
  async getInterestRates() { return { homeLoan: 8.5, carLoan: 9, fixedDeposit: 7 }; }
  async getInflationData() { return { planningRate: 6 }; }
}
