import { notFound } from "next/navigation";
import { calculatorBySlug, calculators } from "@datastorified/calculators-engine/registry";
import { breadcrumbSchema, canonical, createMetadata, faqSchema, serializeJsonLd, softwareApplicationSchema } from "@datastorified/seo";
import CalculatorExperience from "./calculator-experience";
export function generateStaticParams() { return calculators.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const calculator = calculatorBySlug(slug); return calculator ? createMetadata(`${calculator.name} — DataStorified`, calculator.description, "calculators.datastorified.com", `/${slug}`) : {}; }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const calculator = calculatorBySlug(slug); if (!calculator) notFound(); const url = canonical("calculators.datastorified.com", `/${slug}`);
  const schemas = [faqSchema([{ question: `How does the ${calculator.name} work?`, answer: calculator.formula }, { question: "Is my information uploaded?", answer: "No. Calculations and drafts stay in your browser." }]), softwareApplicationSchema({ name: calculator.name, description: calculator.description, url, category: "FinanceApplication" }), breadcrumbSchema([{ name: "Calculators", url: canonical("calculators.datastorified.com") }, { name: calculator.category, url: canonical("calculators.datastorified.com", "/#categories") }, { name: calculator.name, url }])];
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schemas) }} /><CalculatorExperience calculator={calculator}/></>;
}
