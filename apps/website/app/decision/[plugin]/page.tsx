import { notFound, redirect } from "next/navigation";
import { decisionPluginRegistry } from "@datastorified/decision-os";

export const dynamicParams = false;
export function generateStaticParams() { return decisionPluginRegistry.listWorkflows().map(({ slug }) => ({ plugin: slug })); }

export default async function LegacyDecisionRedirect({ params }: { params: Promise<{ plugin: string }> }) {
  const { plugin: legacySlug } = await params;
  const workflow = decisionPluginRegistry.getWorkflowBySlug(legacySlug);
  if (!workflow) notFound();
  redirect(`/decision/${workflow.pluginId}/${workflow.slug}`);
}
