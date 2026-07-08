import type {
  PersonalizationDataModel,
  PersonalizationSignal,
  ProgressiveProfileField,
  ProgressiveCareerStage,
  ProgressiveHomeOwnership,
  ProgressiveRiskComfort,
  ProfilePromptRule,
  UserPreference,
} from "./types";
import { localProfileStorage } from "./storage/localProfileStorage";
import type { DecisionProfile } from "./types";
import { getProfileAnalysis } from "./completeness";

export const PROFILE_PROMPT_RULES: readonly ProfilePromptRule[] = [
  { id: "age-range", field: "ageRange", label: "Age range", benefit: "Improves life-stage assumptions.", reason: "Different age ranges often change long-term planning.", skipLabel: "Skip for now", priority: 80, contexts: ["money", "career", "retirement"] },
  { id: "city", field: "city", label: "City", benefit: "Improves location-sensitive decisions.", reason: "City can change rent, commute, and cost-of-living assumptions.", skipLabel: "Skip for now", priority: 95, contexts: ["home", "buying", "career"] },
  { id: "income-range", field: "incomeRange", label: "Income range", benefit: "Improves affordability analysis.", reason: "Income range helps estimate room for trade-offs without asking raw salary.", skipLabel: "Skip for now", priority: 90, contexts: ["money", "home"] },
  { id: "risk-comfort", field: "riskComfort", label: "Risk comfort", benefit: "Improves investment and uncertainty handling.", reason: "Risk comfort helps tune caution and explanation depth.", skipLabel: "Skip for now", priority: 85, contexts: ["money", "insurance"] },
  { id: "dependents", field: "dependents", label: "Dependents", benefit: "Improves family-context decisions.", reason: "Dependents can affect stability, protection, and flexibility.", skipLabel: "Skip for now", priority: 70, contexts: ["money", "insurance", "home"] },
  { id: "career-stage", field: "careerStage", label: "Career stage", benefit: "Improves career decision guidance.", reason: "Career stage changes what options feel practical.", skipLabel: "Skip for now", priority: 75, contexts: ["career", "business"] },
  { id: "goals", field: "goals", label: "Goals", benefit: "Improves prioritization across decisions.", reason: "Goals help weigh short- and long-term trade-offs.", skipLabel: "Skip for now", priority: 65, contexts: ["money", "career", "home"] },
  { id: "home-ownership", field: "homeOwnership", label: "Home ownership", benefit: "Improves housing-context decisions.", reason: "Ownership status changes the relevance of rent and house comparisons.", skipLabel: "Skip for now", priority: 88, contexts: ["home", "buying"] },
  { id: "investment-experience", field: "investmentExperience", label: "Investment experience", benefit: "Improves money decision nuance.", reason: "Experience helps tailor caution and terminology.", skipLabel: "Skip for now", priority: 60, contexts: ["money"] },
] as const;

export function buildPersonalizationDataModel(profile?: DecisionProfile | null, signals: PersonalizationSignal[] = []): PersonalizationDataModel {
  const normalizedProfile = normalizeProgressiveProfile(profile);
  const analysis = getProfileAnalysis(profile);
  const confidenceImpacts = PROFILE_PROMPT_RULES.map((rule) => ({
    field: rule.field,
    label: rule.label,
    impact: analysis.nextBestField?.name === rule.field ? 12 : 6,
    explanation: rule.benefit,
  }));
  const preferences = buildUserPreferences(normalizedProfile);

  return {
    profile: normalizedProfile,
    preferences,
    signals,
    confidenceImpacts,
    promptRules: [...PROFILE_PROMPT_RULES],
  };
}

export function normalizeProgressiveProfile(profile?: DecisionProfile | null) {
  if (!profile) return {};
  return {
    ageRange: profile.ageRange,
    city: profile.city,
    incomeRange: profile.incomeRange ?? (profile.preferences?.incomeRange as string | undefined),
    riskComfort: (profile.riskComfort ?? profile.preferences?.riskComfort) as ProgressiveRiskComfort | undefined,
    dependents: profile.dependents,
    careerStage: (profile.careerStage ?? profile.preferences?.careerStage) as ProgressiveCareerStage | undefined,
    goals: profile.goals,
    homeOwnership: (profile.homeOwnership ?? profile.preferences?.homeOwnership) as ProgressiveHomeOwnership | undefined,
    investmentExperience: profile.investmentExperience,
  };
}

export function buildUserPreferences(profile?: DecisionProfile | null): UserPreference[] {
  const next = normalizeProgressiveProfile(profile);
  const source = profile?.source ?? "anonymous";
  const updatedAt = profile?.updatedAt ?? new Date().toISOString();
  return Object.entries(next)
    .flatMap(([field, value]) => {
      if (value === undefined || value === null || value === "") return [];
      return [{
        field: field as ProgressiveProfileField,
        value,
        source,
        updatedAt,
      }];
    });
}

export function buildPersonalizationSignal(type: PersonalizationSignal["type"], partial: Omit<PersonalizationSignal, "type" | "createdAt"> = {}): PersonalizationSignal {
  return {
    type,
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

export function recordLocalProfilePrompt(field: ProgressiveProfileField, accepted: boolean): boolean {
  const current = localProfileStorage.getProfile();
  const promptHistory = typeof current.profile?.preferences?.profilePromptHistory === "string" ? current.profile?.preferences?.profilePromptHistory : "";
  const nextPrompt = `${field}:${accepted ? "accepted" : "skipped"}`;
  const nextHistory = promptHistory ? `${promptHistory}|${nextPrompt}` : nextPrompt;
  return localProfileStorage.saveProfile({
    preferences: {
      ...(current.profile?.preferences ?? {}),
      profilePromptHistory: nextHistory,
    },
  });
}

export function getProfilePromptCopy(rule: ProfilePromptRule) {
  return {
    title: rule.label,
    benefit: rule.benefit,
    reason: rule.reason,
    skipLabel: rule.skipLabel,
  };
}

export function getNextProfilePrompt(profile?: DecisionProfile | null, context?: string) {
  const analysis = getProfileAnalysis(profile);
  const candidates = PROFILE_PROMPT_RULES.filter((rule) => !context || !rule.contexts || rule.contexts.includes(context));
  const next = candidates.find((rule) => rule.field === analysis.nextBestField?.name) ?? candidates.sort((a, b) => b.priority - a.priority)[0];
  return next ? getProfilePromptCopy(next) : undefined;
}
