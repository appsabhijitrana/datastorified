import { decisionPluginRegistry } from "@datastorified/decision-os";
import { localDecisionStorage } from "@datastorified/decision-os";
import type { DecisionMemoryDraft, DecisionReport, DecisionRisk, DecisionScore } from "@datastorified/decision-os";
import type { DecisionRepository } from "./DecisionRepository";
import { normalizeDecision } from "./DecisionRepository";
import type { DecisionRepositoryDecision, DecisionRepositoryInput } from "./types";

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

function normalizeDraft(draft: DecisionMemoryDraft): DecisionMemoryDraft {
  return {
    ...draft,
    currentStep: typeof draft.currentStep === "number" ? draft.currentStep : draft.step,
    updatedAt: draft.updatedAt || new Date().toISOString(),
  };
}

function coerceDecisionResult(decision: DecisionRepositoryDecision): DecisionRepositoryDecision {
  return normalizeDecision({
    ...decision,
    plugin: decision.plugin ?? decisionPluginRegistry.getPlugin(decision.workflow.pluginId) ?? decision.plugin,
    workflow: decision.workflow,
    question: decision.question ?? decision.workflow.title,
    assumptions: decision.assumptions?.length ? decision.assumptions : decision.workflow.assumptions ?? [],
    report: decision.report as DecisionReport | undefined,
    score: decision.score as DecisionScore,
    riskLevel: decision.riskLevel as DecisionRisk["severity"],
  });
}

export class LocalDecisionRepositoryImpl implements DecisionRepository {
  async listDecisions() {
    return localDecisionStorage.listSaved().map((item) => enrich(item as DecisionRepositoryDecision) ?? item as DecisionRepositoryDecision);
  }

  async getDecision(id: string) {
    return enrich(localDecisionStorage.loadDecision(id) as DecisionRepositoryDecision | undefined);
  }

  async saveDecision(decision: DecisionRepositoryInput) {
    const normalized = normalizeDecision(decision);
    localDecisionStorage.saveResult(normalized);
    localDecisionStorage.saveDecision(normalized);
    return normalized;
  }

  async deleteDecision(id: string) {
    localDecisionStorage.remove(id);
  }

  async saveDraft(draft: DecisionMemoryDraft) {
    const normalized = normalizeDraft(draft);
    localDecisionStorage.saveDraft(normalized);
    return normalized;
  }

  async updateDraft(draft: DecisionMemoryDraft) {
    const normalized = normalizeDraft(draft);
    localDecisionStorage.updateDraft(normalized);
    return normalized;
  }

  async getDraft(workflowId: string) {
    return localDecisionStorage.getDraft(workflowId);
  }

  async deleteDraft(workflowId: string) {
    localDecisionStorage.deleteDraft(workflowId);
  }

  async listDrafts() {
    return localDecisionStorage.listDrafts();
  }

  async saveDecisionResult(result: DecisionRepositoryDecision) {
    const normalized = coerceDecisionResult(result);
    localDecisionStorage.saveDecisionResult(normalized);
    return normalized;
  }

  async getDecisionResult(id: string) {
    return enrich(localDecisionStorage.getDecisionResult(id) as DecisionRepositoryDecision | undefined);
  }

  async deleteDecisionResult(id: string) {
    localDecisionStorage.deleteDecisionResult(id);
  }

  async listDecisionResults() {
    return localDecisionStorage.listDecisionResults().map((item) => enrich(item as DecisionRepositoryDecision) ?? item as DecisionRepositoryDecision);
  }

  async saveRecentDecision(result: DecisionRepositoryDecision) {
    const normalized = coerceDecisionResult(result);
    localDecisionStorage.saveRecentDecision(normalized);
    return normalized;
  }

  async listRecentDecisions() {
    return localDecisionStorage.listRecentDecisions().map((item) => enrich(item as DecisionRepositoryDecision) ?? item as DecisionRepositoryDecision);
  }

  async clearHistory() {
    localDecisionStorage.clearHistory();
  }
}

export const LocalDecisionRepository = LocalDecisionRepositoryImpl;
