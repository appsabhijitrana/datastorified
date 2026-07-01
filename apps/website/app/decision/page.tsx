import { BrainCircuit, CheckCircle2, SlidersHorizontal } from "lucide-react";
import { Badge, Card, Footer, Header } from "@datastorified/ui";
import { decisionPluginRegistry } from "@datastorified/decision-os";
import { breadcrumbSchema, canonical, createMetadata, serializeJsonLd } from "@datastorified/seo";
import { DecisionCategoryGrid } from "../../components/decision/DecisionCategoryGrid";
import { DecisionHero } from "../../components/decision/DecisionHero";
import { DecisionRecent } from "../../components/decision/DecisionRecent";

const url = canonical("datastorified.com", "/decision");
export const metadata = createMetadata("Decision OS — Guided Decisions for Money, Property & Career", "Describe the decision you are making and get a transparent score, risks, scenarios, recommendation, and action plan.", "datastorified.com", "/decision");
const workflows = decisionPluginRegistry.listWorkflows();
const schemas = [{ "@context": "https://schema.org", "@type": "CollectionPage", name: "DataStorified Decision OS", description: "Config-driven decision workflows with transparent scoring and risk checks.", url, mainEntity: { "@type": "ItemList", itemListElement: workflows.map((workflow, index) => ({ "@type": "ListItem", position: index + 1, name: workflow.title, url: canonical("datastorified.com", `/decision/${workflow.pluginId}/${workflow.slug}`) })) } }, breadcrumbSchema([{ name: "DataStorified", url: canonical("datastorified.com") }, { name: "Decision OS", url }])];

export default function DecisionLanding() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schemas) }} /><Header /><main><DecisionHero /><section id="categories" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20"><div className="max-w-2xl"><Badge>Popular decisions</Badge><h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Start with a decision that matters now</h2><p className="mt-3 leading-7 text-muted">Choose a category or search naturally. Every flow uses visible questions, calculator outputs, rules, and weights.</p></div><div className="mt-8"><DecisionCategoryGrid /></div></section><DecisionRecent /><section className="bg-soft py-16"><div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-3">{[[BrainCircuit, "Decision science first", "Config-driven factors and weights produce every score."], [SlidersHorizontal, "Test the assumptions", "What-if controls reveal which inputs can change the answer."], [CheckCircle2, "Leave with a next step", "Every result includes risks, a recommendation, and an action plan."]].map(([Icon, title, body]) => { const I = Icon as typeof BrainCircuit; return <Card key={String(title)} className="p-6"><I className="text-primary" /><h3 className="mt-4 text-lg font-bold">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-muted">{String(body)}</p></Card>; })}</div></section></main><Footer /></>;
}
