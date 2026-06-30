import { notFound } from "next/navigation";
import { toolBySlug, tools } from "@datastorified/tools-engine/registry";
import { breadcrumbSchema, canonical, createMetadata, faqSchema, serializeJsonLd, softwareApplicationSchema } from "@datastorified/seo";
import ToolExperience from "./tool-experience";
export function generateStaticParams() { return tools.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const tool = toolBySlug(slug); return tool ? createMetadata(`${tool.name} — DataStorified`, tool.description, "tools.datastorified.com", `/${slug}`) : {}; }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const tool = toolBySlug(slug); if (!tool) notFound(); const url = canonical("tools.datastorified.com", `/${slug}`);
  const schemas = [faqSchema([{ question: `Does ${tool.name} upload my data?`, answer: "No. Tools process text and files locally in the browser." }, { question: "Is this tool free?", answer: "Yes. These tools work without an account." }]), softwareApplicationSchema({ name: tool.name, description: tool.description, url }), breadcrumbSchema([{ name: "Tools", url: canonical("tools.datastorified.com") }, { name: tool.category, url: canonical("tools.datastorified.com", "/#categories") }, { name: tool.name, url }])];
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schemas) }} /><ToolExperience tool={tool}/></>;
}
