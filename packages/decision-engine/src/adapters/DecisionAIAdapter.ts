import type { DecisionAnalysis } from "../types";
export interface DecisionAIAdapter { explainDecision(analysis: DecisionAnalysis): Promise<string>; generateActionPlan(analysis: DecisionAnalysis): Promise<string[]>; answerFollowUpQuestion(question: string, analysis: DecisionAnalysis): Promise<string>; }
