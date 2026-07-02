import { decisionPluginRegistry } from "@datastorified/decision-os";

function normalizeRouteText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function findDirectWorkflowMatch(input: string) {
  const normalizedInput = normalizeRouteText(input);
  if (!normalizedInput) return undefined;
  let best: { route: string; score: number } | undefined;

  for (const workflow of decisionPluginRegistry.listWorkflows()) {
    const candidates = [
      workflow.title,
      workflow.slug.replace(/-/gu, " "),
      ...(workflow.intent.aliases ?? []),
      ...(workflow.intent.keywords ?? []),
    ].map(normalizeRouteText).filter(Boolean);

    for (const candidate of candidates) {
      if (!normalizedInput.includes(candidate)) continue;
      const score = candidate.length + (candidate.split(" ").length * 10);
      if (!best || score > best.score) {
        best = { route: `/decision/${workflow.pluginId}/${workflow.slug}`, score };
      }
    }
  }

  return best?.route;
}

export function decisionRouteFromText(input: string): string | undefined {
  const directMatch = findDirectWorkflowMatch(input);
  if (directMatch) return directMatch;

  const workflow = decisionPluginRegistry.detectWorkflowFromText(input);
  if (workflow) return `/decision/${workflow.pluginId}/${workflow.slug}`;
  const fallback = decisionPluginRegistry.searchWorkflows(input, 1)[0];
  return fallback ? `/decision/${fallback.pluginId}/${fallback.slug}` : undefined;
}
