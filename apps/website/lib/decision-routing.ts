import { resolveDecisionRoute } from "@datastorified/decision-os";

export function decisionRouteFromText(input: string): string | undefined {
  return resolveDecisionRoute(input);
}
