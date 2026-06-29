const KEYS = {
  recentCalculators: "ds.recent.calculators", recentTools: "ds.recent.tools",
  favoriteCalculators: "ds.favorites.calculators", favoriteTools: "ds.favorites.tools",
  searches: "ds.search.history", preferences: "ds.preferences", drafts: "ds.drafts"
} as const;
const read = <T>(key: string, fallback: T): T => { if (typeof window === "undefined") return fallback; try { return JSON.parse(localStorage.getItem(key) || "") as T; } catch { return fallback; } };
const write = (key: string, value: unknown) => {
  if (typeof window === "undefined") return false;
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
};
const pushUnique = (key: string, value: string, limit: number) => { const next = [value, ...read<string[]>(key, []).filter(x => x !== value)].slice(0, limit); write(key, next); return next; };
export const storageKeys = KEYS;
export const storage = {
  getRecent: (type: "calculators" | "tools") => read<string[]>(type === "calculators" ? KEYS.recentCalculators : KEYS.recentTools, []),
  addRecent: (type: "calculators" | "tools", slug: string) => pushUnique(type === "calculators" ? KEYS.recentCalculators : KEYS.recentTools, slug, 30),
  getFavorites: (type: "calculators" | "tools") => read<string[]>(type === "calculators" ? KEYS.favoriteCalculators : KEYS.favoriteTools, []),
  toggleFavorite(type: "calculators" | "tools", slug: string) { const key = type === "calculators" ? KEYS.favoriteCalculators : KEYS.favoriteTools; const old = read<string[]>(key, []); const active = !old.includes(slug); write(key, active ? [slug, ...old].slice(0, 50) : old.filter(x => x !== slug)); return active; },
  addSearch: (query: string) => pushUnique(KEYS.searches, query.trim(), 25),
  getSearches: () => read<string[]>(KEYS.searches, []),
  getDraft: <T>(slug: string, fallback: T) => read<Record<string,T>>(KEYS.drafts, {})[slug] ?? fallback,
  saveDraft<T>(slug: string, draft: T) { write(KEYS.drafts, { ...read<Record<string,T>>(KEYS.drafts, {}), [slug]: draft }); },
  getPreferences: () => read<Record<string,string>>(KEYS.preferences, {}),
  savePreferences: (value: Record<string,string>) => write(KEYS.preferences, value)
};
