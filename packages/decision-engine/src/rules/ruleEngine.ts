import { compare } from "./operators";
import type { DecisionRule, RuleEvaluation } from "../types";
export const evaluateRules = (rules: DecisionRule[], metrics: Record<string, number | string | boolean>): RuleEvaluation[] => rules.map((rule) => ({ ...rule, matched: compare(metrics[rule.metric], rule.operator, rule.value) }));
