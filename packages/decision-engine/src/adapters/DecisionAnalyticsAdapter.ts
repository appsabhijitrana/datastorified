export interface DecisionAnalyticsAdapter { track(event: string, properties?: Record<string, string | number | boolean>): void; }
