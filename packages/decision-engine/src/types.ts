export type DecisionCategory = "property" | "vehicle" | "investment" | "debt" | "safety" | "career";
export type AnswerValue = string | number | boolean;
export type DecisionAnswers = Record<string, AnswerValue | undefined>;
export type QuestionType = "currency" | "percentage" | "number" | "select" | "boolean" | "duration" | "text" | "slider";
export type Operator = "equals" | "not_equals" | "greater_than" | "less_than" | "greater_than_or_equal" | "less_than_or_equal" | "between" | "not_between" | "exists" | "not_exists";
export type Severity = "low" | "medium" | "high";
export type RiskLevel = "low" | "medium" | "high";

export type VisibilityCondition = { dependsOn: string; operator: Operator; value?: AnswerValue | [number, number] };
export type QuestionOption = { label: string; value: string | number };
export type DecisionQuestion = {
  id: string; label: string; type: QuestionType; required?: boolean; min?: number; max?: number; step?: number;
  helperText?: string; defaultValue?: AnswerValue; options?: QuestionOption[]; visibility?: VisibilityCondition;
};
export type RuleEffect = { type: "penalty" | "bonus"; score: number; severity: Severity };
export type DecisionRule = { id: string; label: string; metric: string; operator: Operator; value?: AnswerValue | [number, number]; effect: RuleEffect; message: string; factor: string };
export type DecisionFactorDefinition = { id: string; label: string; weight: number; explanation: string };
export type RecommendationTemplate = { minScore: number; verdict: string; summary: string; actions: string[]; pros: string[]; cons: string[] };
export type ScenarioVariable = { answerId: string; label: string; min: number; max: number; step: number; type: "currency" | "percentage" | "number" };
export type DecisionConfig = {
  id: string; title: string; question: string; category: DecisionCategory; description: string; aliases: string[]; keywords: string[];
  questions: DecisionQuestion[]; factors: DecisionFactorDefinition[]; rules: DecisionRule[]; recommendations: RecommendationTemplate[];
  relatedCalculators: string[]; relatedTools: string[]; faq: Array<{ question: string; answer: string }>; scenarios: ScenarioVariable[];
};
export type IntentMatch = { decisionId: string; category: DecisionCategory; confidence: number; matchedTerms: string[]; title: string };
export type IntentResult = IntentMatch & { suggestions: IntentMatch[] };
export type RuleEvaluation = DecisionRule & { matched: boolean };
export type ScoreFactor = { id: string; label: string; score: number; weight: number; status: "good" | "caution" | "risk"; explanation: string };
export type ScoreResult = { score: number; label: string; confidence: number; riskLevel: RiskLevel; factors: ScoreFactor[]; evaluations: RuleEvaluation[] };
export type Risk = { id: string; label: string; severity: Severity; message: string };
export type RiskResult = { riskScore: number; riskLevel: RiskLevel; risks: Risk[] };
export type Recommendation = { verdict: string; summary: string; reasons: string[]; pros: string[]; cons: string[]; actionPlan: string[]; nextBestAction: string };
export type DecisionAnalysis = { config: DecisionConfig; answers: DecisionAnswers; metrics: Record<string, number | string | boolean>; score: ScoreResult; risk: RiskResult; recommendation: Recommendation };
export type StoredDecision = { id: string; question: string; decisionId: string; answers: DecisionAnswers; analysis: DecisionAnalysis; createdAt: string; updatedAt: string; saved?: boolean };
export type DecisionReport = { title: string; question: string; createdAt: string; inputs: Array<{ label: string; value: string }>; score: ScoreResult; factors: ScoreFactor[]; risks: Risk[]; recommendation: Recommendation; actionPlan: string[]; assumptions: string[]; disclaimer: string };
