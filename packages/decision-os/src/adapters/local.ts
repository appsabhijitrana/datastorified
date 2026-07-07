import { getProfileCompleteness } from "@datastorified/profile";
import { localProfileStorage } from "@datastorified/profile";
import type { DecisionProfile, DecisionProfileEnvelope } from "@datastorified/profile";
import { createDataStorifiedClient } from "@datastorified/sdk";
import type { DecisionMemoryDraft, DecisionMemoryProfile, StoredDecision } from "../types";
import { localDecisionStorage } from "../storage/localDecisionStorage";
import type { DecisionAIAdapter } from "./DecisionAIAdapter";
import type { DecisionKnowledgeAdapter } from "./DecisionKnowledgeAdapter";
import type { DecisionMemoryAdapter } from "./DecisionMemoryAdapter";
import type { DecisionPersistenceAdapter } from "./DecisionPersistenceAdapter";
import type { DecisionProfileAdapter } from "./DecisionProfileAdapter";
import type { DecisionSyncAdapter } from "./DecisionSyncAdapter";
import type { DecisionReport, DecisionWorkflow } from "../types";

export class LocalDecisionPersistenceAdapter implements DecisionPersistenceAdapter {
  async saveDecision(decision: StoredDecision): Promise<StoredDecision> {
    localDecisionStorage.saveDecision(decision);
    return decision;
  }

  async getDecision(id: string): Promise<StoredDecision | undefined> {
    return localDecisionStorage.loadDecision(id);
  }

  async listDecisions(): Promise<StoredDecision[]> {
    return localDecisionStorage.listSaved();
  }

  async deleteDecision(id: string): Promise<void> {
    localDecisionStorage.deleteSaved(id);
  }
}

export class LocalProfileAdapter implements DecisionProfileAdapter {
  private readonly client = createDataStorifiedClient();

  private async readRemoteProfile(): Promise<DecisionProfileEnvelope | null> {
    const result = await this.client.profile.get();
    if (!result.ok) return null;
    return result.data;
  }

  private async writeRemoteProfile(profile: Partial<DecisionProfile>): Promise<DecisionProfileEnvelope | null> {
    const result = await this.client.profile.update(profile);
    if (!result.ok) return null;
    return result.data;
  }

  async getProfile() {
    const remote = await this.readRemoteProfile();
    if (remote) return remote;
    return localProfileStorage.getProfile();
  }

  async updateProfile(profile: Partial<DecisionProfile>) {
    const remote = await this.writeRemoteProfile(profile);
    if (remote) {
      localProfileStorage.saveEnvelope(remote);
      return remote;
    }
    localProfileStorage.saveProfile(profile);
    return localProfileStorage.getProfile();
  }

  async getCompleteness() {
    const envelope = await this.getProfile();
    const profile = "profile" in envelope ? envelope.profile : envelope;
    return getProfileCompleteness(profile);
  }
}

export class StaticAIAdapter implements DecisionAIAdapter {
  async explainDecision(report: DecisionReport): Promise<string> {
    return `${report.recommendation?.title ?? "Decision"} · ${report.recommendation?.summary ?? "Review the configured factors."}`;
  }

  async generateActionPlan(report: DecisionReport): Promise<string[]> {
    return report.actionPlan.length ? report.actionPlan : ["Review the top risk", "Validate your assumptions", "Rerun the decision"];
  }

  async answerFollowUpQuestion(question: string, context: { workflow?: { title: string }; report?: DecisionReport; profile?: DecisionProfile }) {
    const title = context.workflow?.title ?? "this decision";
    const completeness = getProfileCompleteness(context.profile);
    return `For ${title}, start with ${question.toLowerCase()} and keep the profile signal at ${Math.round(completeness.percentage)}%.`;
  }
}

export class StaticKnowledgeAdapter implements DecisionKnowledgeAdapter {
  async getAssumptions(workflow?: DecisionWorkflow | { id?: string; slug?: string; category?: string }) {
    if (workflow && "assumptions" in workflow && Array.isArray(workflow.assumptions)) return workflow.assumptions;
    return [];
  }

  async getMarketData(query?: { symbol?: string; category?: string }) {
    return { symbol: query?.symbol ?? "N/A", category: query?.category ?? "general", source: "static" };
  }

  async getRates(query?: { region?: string; kind?: string }) {
    return {
      baseline: query?.kind === "loan" ? 9 : 6.5,
    };
  }
}

export class NoopSyncAdapter implements DecisionSyncAdapter {
  async syncLocalToCloud() {
    return { syncedCount: 0, conflictedIds: [] };
  }

  async resolveConflicts<T>(localValue: T): Promise<T> {
    return localValue;
  }
}

export class LocalDecisionMemoryAdapter implements DecisionMemoryAdapter {
  async listRecent() { return localDecisionStorage.listRecent(); }
  async listSaved() { return localDecisionStorage.listSaved(); }
  async listHistory() { return localDecisionStorage.listHistory(); }
  async saveResult(decision: StoredDecision) { localDecisionStorage.saveResult(decision); }
  async saveDecision(decision: StoredDecision) { localDecisionStorage.saveDecision(decision); }
  async loadDecision(id: string) { return localDecisionStorage.loadDecision(id); }
  async deleteSaved(id: string) { localDecisionStorage.deleteSaved(id); }
  async clear() { localDecisionStorage.clear(); }
  async getDraft(workflowId: string) { return localDecisionStorage.getDraft(workflowId); }
  async saveDraft(draft: DecisionMemoryDraft) { return localDecisionStorage.saveDraft(draft); }
  async clearDraft(workflowId: string) { return localDecisionStorage.clearDraft(workflowId); }
  async listDrafts() { return localDecisionStorage.listDrafts(); }
  async getProfile(): Promise<DecisionMemoryProfile> {
    const envelope = localProfileStorage.getProfile();
    return {
      lastOpenedWorkflow: envelope.lastOpenedWorkflow,
      updatedAt: envelope.updatedAt,
    };
  }

  async saveProfile(profile: DecisionMemoryProfile) {
    const current = localProfileStorage.getProfile();
    const next: DecisionProfileEnvelope = {
      ...current,
      lastOpenedWorkflow: profile.lastOpenedWorkflow ?? current.lastOpenedWorkflow,
      updatedAt: profile.updatedAt ?? new Date().toISOString(),
    };
    localProfileStorage.saveEnvelope(next);
    return true;
  }
}
