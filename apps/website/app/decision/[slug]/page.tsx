import { notFound } from "next/navigation";
import { Breadcrumb, Footer, Header } from "@datastorified/ui";
import { decisionById, decisions } from "@datastorified/decision-engine";
import { breadcrumbSchema, canonical, createMetadata, faqSchema, serializeJsonLd } from "@datastorified/seo";
import { DecisionFlow } from "../../../components/decision/DecisionFlow";

export const dynamicParams = false;

export function generateStaticParams() {
  return decisions.map(({ id }) => ({ slug: id }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = decisionById(slug);
  return config ? createMetadata(
    `${config.title} — Free Decision Guide | DataStorified`,
    `${config.description} Get a transparent score, risk assessment, scenario comparison, and action plan.`,
    "datastorified.com",
    `/decision/${slug}`,
  ) : {};
}

export default async function DecisionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = decisionById(slug);
  if (!config) notFound();
  const url = canonical("datastorified.com", `/decision/${slug}`);
  const schemas = [
    faqSchema(config.faq),
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: config.title,
      description: config.description,
      url,
      isPartOf: { "@type": "WebSite", name: "DataStorified", url: canonical("datastorified.com") },
      about: { "@type": "Thing", name: config.title },
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
    <DecisionFlow config={config} />
    <Footer />
  </>;
}
