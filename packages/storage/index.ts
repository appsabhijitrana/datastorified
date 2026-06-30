const KEYS = { recentCalculators: "ds.recent.calculators", recentTools: "ds.recent.tools", favoriteCalculators: "ds.favorites.calculators", favoriteTools: "ds.favorites.tools", searches: "ds.search.history", preferences: "ds.preferences", drafts: "ds.drafts" } as const;
type Surface = "calculators" | "tools";
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const readUnknown = (key: string): unknown => { if (typeof window === "undefined") return undefined; try { return JSON.parse(localStorage.getItem(key) || "null") as unknown; } catch { return undefined; } };
const readList = (key: string) => { const value = readUnknown(key); return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; };
const write = (key: string, value: unknown) => { if (typeof window === "undefined") return false; try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
const keyFor = (type: Surface, calculators: string, tools: string) => type === "calculators" ? calculators : tools;
const pushUnique = (key: string, value: string, limit: number) => { const clean = value.trim(); if (!clean) return readList(key); const next = [clean, ...readList(key).filter((item) => item !== clean)].slice(0, limit); write(key, next); return next; };
export const storageKeys = KEYS;
export const storage = {
  getRecent: (type: Surface) => readList(keyFor(type, KEYS.recentCalculators, KEYS.recentTools)),
  addRecent: (type: Surface, slug: string) => pushUnique(keyFor(type, KEYS.recentCalculators, KEYS.recentTools), slug, 30),
  getFavorites: (type: Surface) => readList(keyFor(type, KEYS.favoriteCalculators, KEYS.favoriteTools)),
  toggleFavorite(type: Surface, slug: string) { const key = keyFor(type, KEYS.favoriteCalculators, KEYS.favoriteTools); const old = readList(key); const active = !old.includes(slug); write(key, active ? [slug, ...old].slice(0, 50) : old.filter((item) => item !== slug)); return active; },
  addSearch: (query: string) => pushUnique(KEYS.searches, query, 25), getSearches: () => readList(KEYS.searches),
  getDraft: <T>(slug: string, fallback: T): T => { const drafts = readUnknown(KEYS.drafts); return isRecord(drafts) && Object.hasOwn(drafts, slug) ? drafts[slug] as T : fallback; },
  saveDraft<T>(slug: string, draft: T) { const current = readUnknown(KEYS.drafts); write(KEYS.drafts, { ...(isRecord(current) ? current : {}), [slug]: draft }); },
  getPreferences: () => { const value = readUnknown(KEYS.preferences); return isRecord(value) ? Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string")) : {}; },
  savePreferences: (value: Record<string, string>) => write(KEYS.preferences, value), clearSearches: () => write(KEYS.searches, []),
};
