import { getProfileAnalysis } from "@datastorified/profile";
import { decisionPluginRegistry } from "@datastorified/decision-os";
import type { PersonalizationContext, PersonalizedRecommendationSet } from "./types";
import { buildProfileRecommendations, deriveNextBestActions, scorePersonalizedWorkflows } from "./rules";

function fallbackProfileAnalysis(context: PersonalizationContext) {
  return context.profileAnalysis ?? getProfileAnalysis(context.profile);
}

function genericWorkflows() {
  return [
    decisionPluginRegistry.getWorkflowBySlug("emergency-fund"),
    decisionPluginRegistry.getWorkflowBySlug("sip-vs-fd"),
    decisionPluginRegistry.getWorkflowBySlug("rent-vs-buy"),
    decisionPluginRegistry.getWorkflowBySlug("loan-prepayment"),
    decisionPluginRegistry.getWorkflowBySlug("job-switch"),
  ].filter(Boolean);
}

export function buildPersonalizedRecommendations(context: PersonalizationContext = {}): PersonalizedRecommendationSet {
  const profileAnalysis = fallbackProfileAnalysis(context);
  const workflowRecommendations = scorePersonalizedWorkflows({ ...context, profileAnalysis });
  const withFallback = workflowRecommendations.length > 0
    ? workflowRecommendations
    : genericWorkflows().map((workflow) => ({
        workflow: workflow!,
        score: 10,
        reason: "A useful starting point for most decision journeys.",
        signals: [],
      }));
  const profileRecommendations = buildProfileRecommendations({ ...context, profileAnalysis });
  const nextBestActions = deriveNextBestActions({ ...context, profileAnalysis }, withFallback);

  return {
    profileAnalysis,
    workflowRecommendations: withFallback,
    profileRecommendations,
    nextBestActions,
    topWorkflow: withFallback[0],
  };
}

