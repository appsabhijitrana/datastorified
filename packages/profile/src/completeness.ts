import type {
  DecisionProfile,
  ProfileAnalysis,
  ProfileAnalysisLevel,
  ProfileCompleteness,
  ProfileFieldDefinition,
  ProfileFieldName,
  ProfileFieldSuggestion,
} from "./types";

export const PROFILE_FIELD_DEFINITIONS: readonly ProfileFieldDefinition[] = [
  { name: "monthlyIncome", label: "Monthly income", weight: 3, description: "Helps size commitments, savings capacity, and affordability." },
  { name: "monthlyExpenses", label: "Monthly expenses", weight: 2.75, description: "Helps estimate breathing room and buffer requirements." },
  { name: "emergencyFund", label: "Emergency fund", weight: 2.5, description: "Helps evaluate resilience and risk tolerance." },
  { name: "liabilities", label: "Liabilities", weight: 2.25, description: "Helps assess debt load and balance-sheet pressure." },
  { name: "activeLoans", label: "Active loans", weight: 2.25, description: "Helps measure current repayment obligations." },
  { name: "monthlyEmis", label: "Monthly EMIs", weight: 2.25, description: "Helps estimate fixed monthly commitments." },
  { name: "assets", label: "Assets", weight: 2, description: "Helps estimate balance-sheet strength and flexibility." },
  { name: "employmentType", label: "Employment type", weight: 1.75, description: "Helps tailor stability assumptions and cash-flow patterns." },
  { name: "riskProfile", label: "Risk profile", weight: 1.75, description: "Helps match recommendations to comfort with uncertainty." },
  { name: "investmentExperience", label: "Investment experience", weight: 1.75, description: "Helps tune explanation depth and caution level." },
  { name: "occupation", label: "Occupation", weight: 1.5, description: "Helps infer context for career and income-sensitive decisions." },
  { name: "goals", label: "Goals", weight: 1.5, description: "Helps prioritize long- and short-term trade-offs." },
  { name: "dependents", label: "Dependents", weight: 1.25, description: "Helps weigh stability, protection, and family obligations." },
  { name: "ageRange", label: "Age range", weight: 1.25, description: "Helps calibrate life-stage assumptions." },
  { name: "country", label: "Country", weight: 1, description: "Helps contextualise legal, tax, and currency assumptions." },
  { name: "state", label: "State", weight: 0.9, description: "Helps with location-sensitive rules and costs." },
  { name: "city", label: "City", weight: 0.9, description: "Helps with locality-sensitive costs and availability." },
  { name: "preferredCurrency", label: "Preferred currency", weight: 0.9, description: "Helps format values and compare costs consistently." },
  { name: "preferredLanguage", label: "Preferred language", weight: 0.75, description: "Helps adapt future explanations and copy." },
];

const fieldLookup = new Map<ProfileFieldName, ProfileFieldDefinition>(PROFILE_FIELD_DEFINITIONS.map((field) => [field.name, field]));

function isFilled(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value != null;
}

export function getProfileFields(): readonly ProfileFieldDefinition[] {
  return PROFILE_FIELD_DEFINITIONS;
}

export function getProfileCompleteness(profile?: DecisionProfile | null): ProfileCompleteness {
  const filledFields: ProfileFieldName[] = [];
  const missingFields: ProfileFieldName[] = [];
  let filledWeight = 0;
  let totalWeight = 0;

  for (const field of PROFILE_FIELD_DEFINITIONS) {
    totalWeight += field.weight;
    const value = profile?.[field.name];
    if (isFilled(value)) {
      filledFields.push(field.name);
      filledWeight += field.weight;
    } else {
      missingFields.push(field.name);
    }
  }

  const percentage = totalWeight === 0 ? 0 : (filledWeight / totalWeight) * 100;

  return {
    score: Math.round(percentage),
    filledWeight,
    totalWeight,
    percentage,
    filledFields,
    missingFields,
  };
}

export function getMissingProfileFields(profile?: DecisionProfile | null): ProfileFieldDefinition[] {
  const completeness = getProfileCompleteness(profile);
  return completeness.missingFields.map((name) => fieldLookup.get(name)).filter(Boolean) as ProfileFieldDefinition[];
}

export function suggestNextBestProfileField(profile?: DecisionProfile | null): ProfileFieldSuggestion | undefined {
  const missingFields = getMissingProfileFields(profile);
  const next = missingFields.sort((left, right) => right.weight - left.weight || left.label.localeCompare(right.label))[0];
  if (!next) return undefined;
  return next;
}

export function getProfileAnalysisLevel(profile?: DecisionProfile | null): ProfileAnalysisLevel {
  if (!profile) return "basic";
  if (profile.source === "cloud" || (profile.cloudHistoryCount ?? 0) > 0) return "advanced";
  return getProfileCompleteness(profile).filledFields.length > 0 ? "better" : "basic";
}

export function getProfileAnalysis(profile?: DecisionProfile | null): ProfileAnalysis {
  const completeness = getProfileCompleteness(profile);
  const level = getProfileAnalysisLevel(profile);
  const nextBestField = suggestNextBestProfileField(profile);
  const label = level === "advanced" ? "Advanced Analysis" : level === "better" ? "Better Analysis" : "Basic Analysis";
  const description =
    level === "advanced"
      ? "Your local profile and cloud history can guide the most accurate analysis tier."
      : level === "better"
        ? "Your saved local profile helps tailor recommendations more precisely."
        : "You can still use Decision OS anonymously; a profile will improve future decisions.";

  return {
    ...completeness,
    level,
    label,
    description,
    nextBestField,
  };
}

export function hasProfileSignal(profile?: DecisionProfile | null): boolean {
  return getProfileCompleteness(profile).filledFields.length > 0 || getProfileAnalysisLevel(profile) === "advanced";
}
