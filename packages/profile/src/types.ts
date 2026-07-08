export const profileAgeRanges = [
  "under-18",
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65-plus",
] as const;

export const profileEmploymentTypes = [
  "student",
  "employed",
  "self-employed",
  "contract",
  "freelance",
  "business-owner",
  "unemployed",
  "retired",
  "homemaker",
  "other",
] as const;

export const profileRiskProfiles = [
  "conservative",
  "moderate",
  "balanced",
  "growth",
  "aggressive",
] as const;

export const profileInvestmentExperience = [
  "none",
  "beginner",
  "intermediate",
  "advanced",
  "expert",
] as const;

export type ProfileAgeRange = (typeof profileAgeRanges)[number];
export type ProfileEmploymentType = (typeof profileEmploymentTypes)[number];
export type ProfileRiskProfile = (typeof profileRiskProfiles)[number];
export type ProfileInvestmentExperience = (typeof profileInvestmentExperience)[number];

export const progressiveProfileFields = [
  "ageRange",
  "city",
  "incomeRange",
  "riskComfort",
  "dependents",
  "careerStage",
  "goals",
  "homeOwnership",
  "investmentExperience",
] as const;

export type ProgressiveProfileField = (typeof progressiveProfileFields)[number];

export type PersonalizationSignalType =
  | "decision_started"
  | "decision_completed"
  | "decision_saved"
  | "profile_prompt_seen"
  | "profile_prompt_skipped"
  | "profile_prompt_completed";

export type ConfidenceImpact = {
  field: ProgressiveProfileField;
  label: string;
  impact: number;
  explanation: string;
};

export type ProgressiveRiskComfort = "low" | "moderate" | "balanced" | "growth" | "high";
export type ProgressiveCareerStage = "student" | "early_career" | "mid_career" | "senior" | "business_owner" | "retired";
export type ProgressiveHomeOwnership = "renting" | "owning" | "planning" | "prefer_not_to_say";

export type UserPreference = {
  field: ProgressiveProfileField;
  value: string | number | boolean | string[] | null;
  source: ProfileSource;
  updatedAt: string;
};

export type ProfilePromptRule = {
  id: string;
  field: ProgressiveProfileField;
  label: string;
  benefit: string;
  reason: string;
  skipLabel: string;
  priority: number;
  contexts?: string[];
};

export type PersonalizationSignal = {
  type: PersonalizationSignalType;
  workflowId?: string;
  decisionSlug?: string;
  category?: string;
  sourceSection?: string;
  isLoggedIn?: boolean;
  deviceType?: string;
  createdAt: string;
};

export type PersonalizationDataModel = {
  profile: ProgressiveProfileData;
  preferences: UserPreference[];
  signals: PersonalizationSignal[];
  confidenceImpacts: ConfidenceImpact[];
  promptRules: ProfilePromptRule[];
};

export type ProgressiveProfileData = {
  ageRange?: ProfileAgeRange;
  city?: string;
  incomeRange?: string;
  riskComfort?: ProgressiveRiskComfort;
  dependents?: number;
  careerStage?: ProgressiveCareerStage;
  goals?: string[];
  homeOwnership?: ProgressiveHomeOwnership;
  investmentExperience?: ProfileInvestmentExperience;
};

export type ProgressiveProfileProfile = ProgressiveProfileData;

export type ProfileSource = "anonymous" | "local" | "cloud";

export type ProfileFieldName =
  | "ageRange"
  | "city"
  | "state"
  | "country"
  | "dependents"
  | "occupation"
  | "employmentType"
  | "preferences"
  | "monthlyIncome"
  | "monthlyExpenses"
  | "emergencyFund"
  | "assets"
  | "liabilities"
  | "activeLoans"
  | "monthlyEmis"
  | "goals"
  | "riskProfile"
  | "investmentExperience"
  | "preferredCurrency"
  | "preferredLanguage";

export type DecisionProfile = {
  ageRange?: ProfileAgeRange;
  city?: string;
  incomeRange?: string;
  riskComfort?: ProgressiveRiskComfort;
  careerStage?: ProgressiveCareerStage;
  homeOwnership?: ProgressiveHomeOwnership;
  state?: string;
  country?: string;
  dependents?: number;
  occupation?: string;
  employmentType?: ProfileEmploymentType;
  preferences?: Record<string, string | number | boolean | null>;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  emergencyFund?: number;
  assets?: number;
  liabilities?: number;
  activeLoans?: number;
  monthlyEmis?: number;
  goals?: string[];
  riskProfile?: ProfileRiskProfile;
  investmentExperience?: ProfileInvestmentExperience;
  preferredCurrency?: string;
  preferredLanguage?: string;
  source?: ProfileSource;
  cloudHistoryCount?: number;
  updatedAt?: string;
};

export type DecisionProfileEnvelope = {
  profile?: DecisionProfile;
  lastOpenedWorkflow?: {
    workflowId: string;
    pluginId: string;
    slug: string;
    openedAt: string;
  };
  updatedAt?: string;
};

export type ProfileFieldDefinition = {
  name: ProfileFieldName;
  label: string;
  weight: number;
  description: string;
};

export type ProfileCompleteness = {
  score: number;
  filledWeight: number;
  totalWeight: number;
  percentage: number;
  filledFields: ProfileFieldName[];
  missingFields: ProfileFieldName[];
};

export type ProfileFieldSuggestion = {
  name: ProfileFieldName;
  label: string;
  description: string;
  weight: number;
};

export type ProfileAnalysisLevel = "basic" | "better" | "advanced";

export type ProfileAnalysis = ProfileCompleteness & {
  level: ProfileAnalysisLevel;
  label: string;
  description: string;
  nextBestField?: ProfileFieldSuggestion;
};

export type RecommendationLike = {
  title: string;
  summary: string;
  actions: readonly string[];
};

export type ProfileAwareRecommendation<TRecommendation extends RecommendationLike> = {
  recommendation: TRecommendation;
  analysis: ProfileAnalysis;
  analysisNote: string;
};
