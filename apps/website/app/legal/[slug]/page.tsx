import { notFound } from "next/navigation";
import { createMetadata } from "@datastorified/seo";
import { LegalLayout } from "../../../components/legal";
import { legalPolicies, legalPolicyBySlug } from "../../../lib/legal-content";

export function generateStaticParams() {
  return legalPolicies.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = legalPolicyBySlug(slug);
  return policy ? createMetadata(`${policy.title} | DataStorified`, policy.description, "datastorified.com", `/legal/${slug}`) : {};
}

export default async function LegalPolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = legalPolicyBySlug(slug);
  if (!policy) notFound();
  return <LegalLayout policy={policy} />;
}

