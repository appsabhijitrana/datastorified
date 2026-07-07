import type { DecisionProfile } from "@datastorified/profile";
import type { DecisionReport, DecisionWorkflow } from "../types";

export interface DecisionAIAdapter {
  explainDecision(report: DecisionReport, profile?: DecisionProfile): Promise<string>;
  generateActionPlan(report: DecisionReport, profile?: DecisionProfile): Promise<string[]>;
  answerFollowUpQuestion(question: string, context: { workflow?: DecisionWorkflow; report?: DecisionReport; profile?: DecisionProfile }): Promise<string>;
}

export type DecisionFollowUpContext = Parameters<DecisionAIAdapter["answerFollowUpQuestion"]>[1];
