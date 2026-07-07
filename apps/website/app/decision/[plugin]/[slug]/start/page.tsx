import { notFound } from "next/navigation";
import { decisionPluginRegistry } from "@datastorified/decision-os";
import { AppShell } from "../../../../../components/shell/AppShell";
import { DecisionFlow } from "../../../../../components/decision/DecisionFlow";

export const dynamicParams = false;
export function generateStaticParams() { return decisionPluginRegistry.listWorkflows().map(({ pluginId, slug }) => ({ plugin: pluginId, slug })); }

export default async function DecisionStartPage({ params }: { params: Promise<{ plugin: string; slug: string }> }) {
  const { plugin, slug } = await params;
  const workflow = decisionPluginRegistry.getWorkflowBySlug(slug);
  if (!workflow || workflow.pluginId !== plugin) notFound();
  return <AppShell showMobileNav={false}><DecisionFlow pluginId={plugin} slug={slug} /></AppShell>;
}
