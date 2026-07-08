export type AnalyticsValue = string | number | boolean | undefined;
export type AnalyticsPayload = Record<string, AnalyticsValue>;
export type PrivacySafeProfileAnalyticsPayload = {
  profile_source?: "anonymous" | "local" | "cloud";
  completeness_score?: number;
  missing_fields_count?: number;
  prompt_field?: string;
  prompt_context?: string;
  is_logged_in?: boolean;
};
type AnalyticsWindow = Window & {
  gtag?: (command: "event", name: string, payload: AnalyticsPayload) => void;
};

export function trackEvent(name: string, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") return;
  const browser = window as AnalyticsWindow;
  try { browser.gtag?.("event", name, payload); } catch { /* Analytics must never interrupt product use. */ }
  window.dispatchEvent(new CustomEvent("datastorified:analytics", { detail: { name, payload } }));
}
export const trackDiscoveryEvent = (
  eventName:
    | "decision_search_opened"
    | "decision_search_submitted"
    | "decision_search_result_clicked"
    | "decision_card_clicked"
    | "category_clicked"
    | "decision_started"
    | "decision_suggested"
    | "related_decision_clicked"
    | "recommendation_clicked",
  metadata: {
    decision_slug?: string;
    category?: string;
    source_section?: string;
    search_result_count?: number;
    is_logged_in?: boolean;
    device_type?: string;
  } = {},
) => trackEvent(eventName, metadata);
export function trackPrivacySafeProfileEvent(
  name:
    | "profile_prompt_seen"
    | "profile_prompt_skipped"
    | "profile_prompt_completed"
    | "profile_progress_saved",
  payload: PrivacySafeProfileAnalyticsPayload = {},
) {
  trackEvent(name, payload);
}
export const trackToolUsed = (slug: string) => trackEvent("tool_used", { slug });
export const trackCalculatorUsed = (slug: string) => trackEvent("calculator_used", { slug });
export const trackSearch = (query: string, surface: string) => trackEvent("search", { query, surface });
export const trackFavorite = (slug: string, type: string, active: boolean) => trackEvent("favorite", { slug, type, active });
export const trackRecent = (slug: string, type: string) => trackEvent("recent_opened", { slug, type });
export const trackDecisionAsked = (query: string) => trackEvent("decision_asked", { query });
export const trackDecisionEvent = (name: "decision_search_started" | "decision_intent_detected" | "decision_started" | "decision_question_answered" | "decision_score_updated" | "decision_completed" | "decision_saved_local" | "decision_report_copied" | "decision_scenario_changed" | "decision_related_calculator_clicked", payload: AnalyticsPayload = {}) => trackEvent(name, payload);
