import type { DecisionIntentMatch, DecisionIntentResult, DecisionWorkflow } from "../types";
import { normalizeText } from "../utils/format";
import { clamp, round } from "../utils/math";

function tokens(value: string): string[] {
  return normalizeText(value).split(" ").filter((token) => token.length > 1);
}

function editDistance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= right.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

function similarity(left: string, right: string): number {
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.86;
  return 1 - editDistance(left, right) / Math.max(left.length, right.length, 1);
}

function matchWorkflow(input: string, workflow: DecisionWorkflow): DecisionIntentMatch {
  const query = normalizeText(input);
  const queryTokens = tokens(query);
  const phrases = [...(workflow.intent.aliases ?? []), ...(workflow.intent.examples ?? [])].map(normalizeText);
  const terms = [...new Set([...workflow.intent.keywords.flatMap(tokens), ...phrases.flatMap(tokens)])];
  const matchedTerms = terms.filter((term) => queryTokens.some((token) => token === term || (token.length >= 4 && similarity(token, term) >= 0.75)));
  const phraseMatch = phrases.some((phrase) => query.includes(phrase));
  const bestPhraseSimilarity = phrases.reduce((best, phrase) => Math.max(best, similarity(query, phrase)), 0);
  const coverage = matchedTerms.length / Math.max(1, Math.min(queryTokens.length, terms.length));
  const confidence = clamp((phraseMatch ? 0.55 : 0) + bestPhraseSimilarity * 0.2 + coverage * 0.35, 0, 1);
  return {
    pluginId: workflow.pluginId,
    workflowId: workflow.id,
    workflowSlug: workflow.slug,
    title: workflow.title,
    confidence: round(confidence, 3),
    matchedTerms,
  };
}

export function detectIntent(input: string, workflows: readonly DecisionWorkflow[], limit = 3): DecisionIntentResult {
  const matches = workflows.map((workflow) => matchWorkflow(input, workflow)).sort((left, right) => right.confidence - left.confidence).slice(0, Math.max(0, limit));
  return { input, bestMatch: matches[0], matches };
}
