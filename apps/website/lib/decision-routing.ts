import { decisionPluginRegistry } from "@datastorified/decision-os";

export function decisionRouteFromText(input: string): string | undefined {
  const workflow = decisionPluginRegistry.detectWorkflowFromText(input);
  return workflow ? `/decision/${workflow.pluginId}/${workflow.slug}` : undefined;
}
