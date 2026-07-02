import type { Incident, ServiceStatus } from "./types";

export const defaultStatusServices: ServiceStatus[] = [
  { id: "website", name: "Website", description: "Public pages, decision flows, and navigation.", state: "operational", updatedAt: "2026-07-03T00:00:00.000Z" },
  { id: "api", name: "API", description: "Public server routes used by the frontend.", state: "operational", updatedAt: "2026-07-03T00:00:00.000Z" },
  { id: "authentication", name: "Authentication", description: "Google sign-in and session handling.", state: "operational", updatedAt: "2026-07-03T00:00:00.000Z" },
  { id: "database", name: "Database", description: "Primary application storage and sync data.", state: "operational", updatedAt: "2026-07-03T00:00:00.000Z" },
  { id: "decisionEngine", name: "Decision Engine", description: "Workflow scoring, rules, and recommendations.", state: "operational", updatedAt: "2026-07-03T00:00:00.000Z" },
  { id: "comparisons", name: "Comparisons", description: "Core calculator-linked comparison flows.", state: "operational", updatedAt: "2026-07-03T00:00:00.000Z" },
  { id: "aiRecommendation", name: "AI Recommendation", description: "Future AI-assisted explanations and summaries.", state: "operational", updatedAt: "2026-07-03T00:00:00.000Z" },
  { id: "search", name: "Search", description: "Decision discovery and workflow matching.", state: "operational", updatedAt: "2026-07-03T00:00:00.000Z" },
];

export const sampleIncidents: Incident[] = [
  {
    id: "incident-2026-06-14-cache-rollout",
    title: "Cache warm-up completed",
    status: "resolved",
    service: "website",
    message: "A short cache warm-up caused brief delays while the platform refreshed static routes.",
    timestamp: "2026-06-14T09:30:00.000Z",
  },
];

