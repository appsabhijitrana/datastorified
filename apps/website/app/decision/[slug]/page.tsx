import { notFound } from "next/navigation";
import { Breadcrumb, Footer, Header } from "@datastorified/ui";
import { decisionById, decisions } from "@datastorified/decision-engine";
import { breadcrumbSchema, canonical, createMetadata, faqSchema, serializeJsonLd } from "@datastorified/seo";
import { DecisionFlow } from "../../../components/decision/DecisionFlow";
import { DecisionSeoContent } from "../../../components/decision/DecisionSeoContent";
import { decisionSeo } from "../../../lib/decision-seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return decisions.map(({ id }) => ({ slug: id }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = decisionById(slug);
  const seo = decisionSeo(slug);
  return config && seo ? createMetadata(
    `${seo.title} | DataStorified`,
    seo.description,
    "datastorified.com",
    `/decision/${slug}`,
  ) : {};
}

export default async function DecisionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = decisionById(slug);
  const seo = decisionSeo(slug);
  if (!config || !seo) notFound();
  const url = canonical("datastorified.com", `/decision/${slug}`);
  const relatedDecisions = [
    ...decisions.filter((decision) => decision.id !== config.id && decision.category === config.category),
    ...decisions.filter((decision) => decision.id !== config.id && decision.category !== config.category),
  ].slice(0, 3);
  const schemas = [
    faqSchema(config.faq),
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: seo.title,
      description: seo.description,
      url,
      isPartOf: { "@type": "WebSite", name: "DataStorified", url: canonical("datastorified.com") },
      about: { "@type": "Thing", name: seo.primaryKeyword },
    },
    breadcrumbSchema([
      { name: "DataStorified", url: canonical("datastorified.com") },
      { name: "Decision Engine", url: canonical("datastorified.com", "/decision") },
      { name: config.title, url },
    ]),
  ];
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schemas) }} />
    <Header />
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6"><Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Decision Engine", href: "/decision" }, { label: config.title }]} /></div>
    <DecisionFlow config={config}>
      <DecisionSeoContent config={config} seo={seo} relatedDecisions={relatedDecisions} />
    </DecisionFlow>
    <Footer />
  </>;
}
