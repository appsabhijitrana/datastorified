export type DecisionRepositoryConfig = {
  baseUrl?: string;
};

export function resolveDecisionApiBaseUrl(config: DecisionRepositoryConfig = {}): string | undefined {
  if (config.baseUrl) return config.baseUrl;
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return undefined;
}
