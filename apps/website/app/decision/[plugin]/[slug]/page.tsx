import { notFound } from "next/navigation";
import { Breadcrumb, Footer, Header } from "@datastorified/ui";
import { decisionPluginRegistry } from "@datastorified/decision-os";
import { breadcrumbSchema, canonical, createMetadata, faqSchema, serializeJsonLd } from "@datastorified/seo";
import { DecisionFlow } from "../../../../components/decision/DecisionFlow";

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
  const url = canonical("datastorified.com", `/decision/${plugin}/${slug}`);
  const schemas = [
    faqSchema(workflow.faqs ?? []),
    { "@context": "https://schema.org", "@type": "WebApplication", name: workflow.title, description: workflow.description, url, applicationCategory: "DecisionSupportApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "INR" } },
    breadcrumbSchema([{ name: "DataStorified", url: canonical("datastorified.com") }, { name: "Decision OS", url: canonical("datastorified.com", "/decision") }, { name: workflow.title, url }]),
  ];
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schemas) }} /><Header /><div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6"><Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Decision OS", href: "/decision" }, { label: workflow.title }]} /></div><DecisionFlow pluginId={plugin} slug={slug} /><Footer /></>;
}
