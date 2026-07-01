export type DecisionScalar = string | number | boolean | null;
export type DecisionValue = DecisionScalar | DecisionScalar[];
export type DecisionAnswers = Record<string, DecisionValue | undefined>;
export type DecisionFacts = Record<string, DecisionValue | undefined>;

export type DecisionAnswer = {
  questionId: string;
  value: DecisionValue;
};

export type DecisionQuestionType =
  | "text"
  | "number"
  | "boolean"
  | "single-select"
  | "multi-select"
  | "date";

export type DecisionOperator =
  | "equals"
  | "not-equals"
  | "greater-than"
  | "greater-than-or-equal"
  | "less-than"
  | "less-than-or-equal"
  | "between"
  | "contains"
  | "in"
  | "exists"
  | "not-exists";

export type DecisionCondition = {
  fact: string;
  operator: DecisionOperator;
  value?: DecisionValue | [number, number];
};

export type DecisionConditionGroup = {
  all?: DecisionCondition[];
  any?: DecisionCondition[];
};

export type DecisionQuestion = {
  id: string;
  prompt: string;
  type: DecisionQuestionType;
  required?: boolean;
  defaultValue?: DecisionValue;
  helperText?: string;
  options?: Array<{ label: string; value: DecisionValue }>;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    message?: string;
  };
  visibleWhen?: DecisionConditionGroup;
};

export type DecisionRisk = {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  sourceRuleId?: string;
  mitigation?: string;
};

export type DecisionRule = {
  id: string;
  description: string;
  when?: DecisionConditionGroup;
  factorId?: string;
  scoreEffect?: {
    operation: "add" | "subtract" | "set";
    value: number;
  };
  risk?: Omit<DecisionRisk, "sourceRuleId">;
  tags?: string[];
};

export type DecisionRuleEvaluation = {
  rule: DecisionRule;
  matched: boolean;
};

export type DecisionWeight = {
  factorId: string;
  label: string;
  weight: number;
  baselineScore?: number;
};

export type DecisionFactorScore = {
  factorId: string;
  label: string;
  score: number;
  weight: number;
  normalizedWeight: number;
  contribution: number;
};

export type DecisionScore = {
  value: number;
  max: 100;
  percentage: number;
  label?: string;
  factors: DecisionFactorScore[];
};

export type DecisionRecommendation = {
  id: string;
  minScore: number;
  maxScore: number;
  title: string;
  summary: string;
  actions: string[];
  when?: DecisionConditionGroup;
};

export type DecisionScenario = {
  id: string;
  label: string;
  description?: string;
  overrides: DecisionAnswers;
};

export type DecisionScenarioResult = {
  scenario: DecisionScenario;
  answers: DecisionAnswers;
  report: DecisionReport;
  scoreDelta: number;
};

export type DecisionReport = {
  id: string;
  workflowId: string;
  pluginId: string;
  generatedAt: string;
  answers: DecisionAnswers;
  facts: DecisionFacts;
  ruleEvaluations: DecisionRuleEvaluation[];
  score: DecisionScore;
  risks: DecisionRisk[];
  recommendation?: DecisionRecommendation;
};

export type DecisionWorkflow = {
  id: string;
  pluginId: string;
  version: string;
  title: string;
  description: string;
  intent: {
    keywords: string[];
    aliases?: string[];
    examples?: string[];
  };
  questions: DecisionQuestion[];
  rules: DecisionRule[];
  weights: DecisionWeight[];
  recommendations: DecisionRecommendation[];
  scenarios?: DecisionScenario[];
  scoreBands?: Array<{ min: number; max: number; label: string }>;
  deriveFacts?: (answers: Readonly<DecisionAnswers>) => DecisionFacts;
};

export type DecisionPlugin = {
  id: string;
  name: string;
  version: string;
  description?: string;
  workflows: DecisionWorkflow[];
  metadata?: Record<string, string>;
};

export type DecisionIntentMatch = {
  pluginId: string;
  workflowId: string;
  title: string;
  confidence: number;
  matchedTerms: string[];
};

export type DecisionIntentResult = {
  input: string;
  bestMatch?: DecisionIntentMatch;
  matches: DecisionIntentMatch[];
};

export type StoredDecision = {
  id: string;
  workflowId: string;
  pluginId: string;
  answers: DecisionAnswers;
  report?: DecisionReport;
  createdAt: string;
  updatedAt: string;
};
