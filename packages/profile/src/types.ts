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
