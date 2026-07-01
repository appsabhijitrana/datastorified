import type { DecisionAnswers, StoredDecision } from "../types";
const keys = { recent: "ds.decisions.recent", saved: "ds.decisions.saved", drafts: "ds.decisions.drafts", history: "ds.decisions.history" } as const;
const available = () => typeof window !== "undefined" && !!window.localStorage;
const read = <T>(key: string, fallback: T): T => { if (!available()) return fallback; try { return JSON.parse(window.localStorage.getItem(key) ?? "") as T; } catch { return fallback; } };
const write = (key: string, value: unknown) => { if (!available()) return false; try { window.localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
const upsert = (items: StoredDecision[], item: StoredDecision, limit: number) => [item, ...items.filter((entry) => entry.id !== item.id)].slice(0, limit);

export const decisionStorage = {
  keys,
  addRecent(item: StoredDecision) { return write(keys.recent, upsert(read<StoredDecision[]>(keys.recent, []), item, 20)); },
  listRecent() { return read<StoredDecision[]>(keys.recent, []); },
  save(item: StoredDecision) { const saved = { ...item, saved: true, updatedAt: new Date().toISOString() }; write(keys.history, upsert(read<StoredDecision[]>(keys.history, []), saved, 100)); return write(keys.saved, upsert(read<StoredDecision[]>(keys.saved, []), saved, 50)); },
  get(id: string) { return [...read<StoredDecision[]>(keys.saved, []), ...read<StoredDecision[]>(keys.history, []), ...read<StoredDecision[]>(keys.recent, [])].find((item) => item.id === id); },
  listSaved() { return read<StoredDecision[]>(keys.saved, []); },
  remove(id: string) { return write(keys.saved, read<StoredDecision[]>(keys.saved, []).filter((item) => item.id !== id)); },
  saveDraft(decisionId: string, answers: DecisionAnswers) { const drafts = read<Array<{ decisionId: string; answers: DecisionAnswers; updatedAt: string }>>(keys.drafts, []); return write(keys.drafts, [{ decisionId, answers, updatedAt: new Date().toISOString() }, ...drafts.filter((item) => item.decisionId !== decisionId)].slice(0, 10)); },
  getDraft(decisionId: string) { return read<Array<{ decisionId: string; answers: DecisionAnswers }>>(keys.drafts, []).find((item) => item.decisionId === decisionId)?.answers; },
  clearDraft(decisionId: string) { return write(keys.drafts, read<Array<{ decisionId: string }>>(keys.drafts, []).filter((item) => item.decisionId !== decisionId)); },
};
