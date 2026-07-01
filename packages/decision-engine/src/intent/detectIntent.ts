import { decisions } from "../registry/decisions";
import { categoryKeywords } from "./intentKeywords";
import type { DecisionConfig, IntentMatch, IntentResult } from "../types";
import { clamp, round } from "../utils/math";

const normalize = (value: string) => value.toLocaleLowerCase().replace(/[^a-z0-9\s]/gu, " ").replace(/\s+/gu, " ").trim();
const tokens = (value: string) => normalize(value).split(" ").filter((token) => token.length > 1);
const distance = (a: string, b: string) => {
  const matrix = Array.from({ length: a.length + 1 }, (_, index) => [index]);
  for (let column = 1; column <= b.length; column += 1) matrix[0][column] = column;
  for (let row = 1; row <= a.length; row += 1) for (let column = 1; column <= b.length; column += 1) matrix[row][column] = Math.min(matrix[row - 1][column] + 1, matrix[row][column - 1] + 1, matrix[row - 1][column - 1] + (a[row - 1] === b[column - 1] ? 0 : 1));
  return matrix[a.length][b.length];
};
const fuzzy = (query: string, term: string) => {
  if (query === term) return 1;
  if (query.includes(term) || term.includes(query)) return .8;
  return 1 - distance(query, term) / Math.max(query.length, term.length, 1);
};
function scoreDecision(input: string, config: DecisionConfig): IntentMatch {
  const query = normalize(input); const queryTokens = tokens(query);
  const aliasScores = config.aliases.map((alias) => ({ alias, score: fuzzy(query, normalize(alias)) })).sort((a, b) => b.score - a.score);
  const terms = [...new Set([...config.keywords, ...config.aliases.flatMap(tokens)])];
  const matchedTerms = terms.filter((term) => queryTokens.some((token) => token === term || token.length >= 4 && fuzzy(token, term) >= .72));
  const tokenCoverage = matchedTerms.length / Math.max(2, Math.min(terms.length, queryTokens.length + 1));
  const categoryHits = categoryKeywords[config.category].filter((term) => queryTokens.includes(term)).length;
  const exactAlias = config.aliases.some((alias) => query.includes(normalize(alias)));
  const confidence = clamp((exactAlias ? .74 : 0) + aliasScores[0].score * .18 + tokenCoverage * .35 + categoryHits * .04, 0, .99);
  return { decisionId: config.id, category: config.category, confidence: round(confidence, 2), matchedTerms, title: config.title };
}
export function detectIntent(input: string): IntentResult {
  const suggestions = decisions.map((decision) => scoreDecision(input, decision)).sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  const top = suggestions[0] ?? { decisionId: decisions[0].id, category: decisions[0].category, confidence: 0, matchedTerms: [], title: decisions[0].title };
  return { ...top, suggestions };
}
