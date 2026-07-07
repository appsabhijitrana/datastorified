import type { DecisionProfile, ProfileAwareRecommendation, RecommendationLike } from "./types";
import { getProfileAnalysis } from "./completeness";

type ProfileInput = DecisionProfile | { profile?: DecisionProfile } | null | undefined;

function extractProfile(profileOrEnvelope?: ProfileInput): DecisionProfile | undefined {
  if (!profileOrEnvelope) return undefined;
  if (typeof profileOrEnvelope !== "object") return undefined;
  const envelope = profileOrEnvelope as { profile?: DecisionProfile };
  if ("profile" in envelope) return envelope.profile;
  return profileOrEnvelope as DecisionProfile;
}

export function buildProfileAwareRecommendation<TRecommendation extends RecommendationLike>(
  recommendation: TRecommendation,
  profileOrEnvelope?: ProfileInput,
): ProfileAwareRecommendation<TRecommendation> {
  const profile = extractProfile(profileOrEnvelope);
  const analysis = getProfileAnalysis(profile);
  const analysisNote =
    analysis.level === "advanced"
      ? "Advanced Analysis uses your saved profile and cloud history to sharpen the recommendation."
      : analysis.level === "better"
        ? `Better Analysis uses your local profile to improve the recommendation. Next best field: ${analysis.nextBestField?.label ?? "complete more profile details"}.`
        : `Basic Analysis is anonymous and still works today. Next best field: ${analysis.nextBestField?.label ?? "add profile details"} to improve future results.`;

  return {
    recommendation,
    analysis,
    analysisNote,
  };
}
