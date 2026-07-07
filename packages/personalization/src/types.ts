import type { StoredDecision, DecisionWorkflow } from "@datastorified/decision-os";
import type { DecisionProfile, ProfileAnalysis } from "@datastorified/profile";

export type PersonalizationContext = {
  profile?: DecisionProfile | null;
  profileAnalysis?: ProfileAnalysis;
  recentDecisions?: StoredDecision[];
  savedDecisions?: StoredDecision[];
  history?: StoredDecision[];
  favoriteDecisionIds?: string[];
  favoriteWorkflowIds?: string[];
  recentCalculators?: string[];
  favoriteCalculators?: string[];
};

export type PersonalizationSignal = {
  id: string;
  label: string;
  value: number;
  detail?: string;
};

export type PersonalizedWorkflowRecommendation = {
  workflow: DecisionWorkflow;
  score: number;
  reason: string;
  signals: PersonalizationSignal[];
};

export type PersonalizedActionRecommendation = {
  id: string;
  title: string;
  description: string;
  href?: string;
  type: "workflow" | "profile" | "calculator" | "decision";
};

export type PersonalizedRecommendationSet = {
  profileAnalysis: ProfileAnalysis;
  workflowRecommendations: PersonalizedWorkflowRecommendation[];
  profileRecommendations: PersonalizedActionRecommendation[];
  nextBestActions: PersonalizedActionRecommendation[];
  topWorkflow?: PersonalizedWorkflowRecommendation;
};
