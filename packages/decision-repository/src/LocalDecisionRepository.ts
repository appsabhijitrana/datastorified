import { decisionPluginRegistry } from "@datastorified/decision-os";
import { localDecisionStorage } from "@datastorified/decision-os";
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
}

export const LocalDecisionRepository = LocalDecisionRepositoryImpl;
