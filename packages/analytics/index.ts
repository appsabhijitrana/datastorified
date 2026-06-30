export type AnalyticsValue = string | number | boolean | undefined;
export type AnalyticsPayload = Record<string, AnalyticsValue>;
type AnalyticsWindow = Window & {
  gtag?: (command: "event", name: string, payload: AnalyticsPayload) => void;
  posthog?: { capture: (name: string, payload: AnalyticsPayload) => void };
};

export function trackEvent(name: string, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") return;
  const browser = window as AnalyticsWindow;
  try { browser.gtag?.("event", name, payload); } catch { /* Analytics must never interrupt product use. */ }
  try { browser.posthog?.capture(name, payload); } catch { /* Analytics must never interrupt product use. */ }
  window.dispatchEvent(new CustomEvent("datastorified:analytics", { detail: { name, payload } }));
}
export const trackToolUsed = (slug: string) => trackEvent("tool_used", { slug });
export const trackCalculatorUsed = (slug: string) => trackEvent("calculator_used", { slug });
export const trackSearch = (query: string, surface: string) => trackEvent("search", { query, surface });
export const trackFavorite = (slug: string, type: string, active: boolean) => trackEvent("favorite", { slug, type, active });
export const trackRecent = (slug: string, type: string) => trackEvent("recent_opened", { slug, type });
export const trackDecisionAsked = (query: string) => trackEvent("decision_asked", { query });
