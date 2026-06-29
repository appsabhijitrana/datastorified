export type AnalyticsPayload = Record<string, string | number | boolean | undefined>;
export function trackEvent(name: string, payload: AnalyticsPayload = {}) { if (process.env.NODE_ENV === "development") console.info(`[DataStorified] ${name}`, payload); }
export const trackToolUsed = (slug: string) => trackEvent("tool_used", { slug });
export const trackCalculatorUsed = (slug: string) => trackEvent("calculator_used", { slug });
export const trackSearch = (query: string, surface: string) => trackEvent("search", { query, surface });
export const trackFavorite = (slug: string, type: string, active: boolean) => trackEvent("favorite", { slug, type, active });
