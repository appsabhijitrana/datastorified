export type DecisionAnalyticsEvent = {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: string;
};

export interface DecisionAnalyticsAdapter {
  trackEvent(event: DecisionAnalyticsEvent): Promise<void>;
}
