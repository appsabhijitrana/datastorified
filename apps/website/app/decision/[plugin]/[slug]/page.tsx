import { notFound } from "next/navigation";
import { Breadcrumb } from "@datastorified/ui";
import { decisionPluginRegistry, getDecisionBySlug } from "@datastorified/decision-os";
import { breadcrumbSchema, canonical, createMetadata, faqSchema, serializeJsonLd } from "@datastorified/seo";
import { AppShell } from "../../../../components/shell/AppShell";
import { DecisionIntroPage } from "../../../../components/decision/DecisionIntroPage";

export const dynamicParams = false;
export function generateStaticParams() { return decisionPluginRegistry.listWorkflows().map(({ pluginId, slug }) => ({ plugin: pluginId, slug })); }

export async function generateMetadata({ params }: { params: Promise<{ plugin: string; slug: string }> }) {
  const { plugin, slug } = await params;
  const workflow = decisionPluginRegistry.getWorkflowBySlug(slug);
  return workflow && workflow.pluginId === plugin ? createMetadata(`${workflow.title} | DataStorified`, workflow.description, "datastorified.com", `/decision/${plugin}/${slug}`) : {};
}

export default async function DecisionWorkflowPage({ params }: { params: Promise<{ plugin: string; slug: string }> }) {
  const { plugin, slug } = await params;
  const workflow = decisionPluginRegistry.getWorkflowBySlug(slug);
  if (!workflow || workflow.pluginId !== plugin) notFound();
  const metadata = getDecisionBySlug(slug);
  const url = canonical("datastorified.com", `/decision/${plugin}/${slug}`);
  const schemas = [
    faqSchema(workflow.faqs ?? []),
    { "@context": "https://schema.org", "@type": "WebApplication", name: workflow.title, description: workflow.description, url, applicationCategory: "DecisionSupportApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "INR" } },
    breadcrumbSchema([{ name: "DataStorified", url: canonical("datastorified.com") }, { name: "Decision OS", url: canonical("datastorified.com", "/decision") }, { name: workflow.title, url }]),
  ];
  return <AppShell showMobileNav={false}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schemas) }} /><div className="mx-auto max-w-7xl px-0 pt-2 sm:pt-4"><Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Decision OS", href: "/decision" }, { label: workflow.title }]} /></div><DecisionIntroPage workflow={{ pluginId: workflow.pluginId, slug: workflow.slug, title: workflow.title, description: workflow.description, category: metadata?.category ?? workflow.category, version: workflow.version, questionCount: workflow.questions.length, factorCount: metadata?.factorCount ?? (workflow.weights.length || workflow.questions.length), estimatedTime: metadata?.estimatedTime ?? "3 min", difficulty: metadata?.difficulty ?? "medium", disclaimerType: metadata?.disclaimerType ?? "none" }} /></AppShell>;
}
