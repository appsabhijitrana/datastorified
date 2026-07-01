import { BrainCircuit, CheckCircle2, SlidersHorizontal } from "lucide-react";
import { Badge, Card, Footer, Header } from "@datastorified/ui";
import { decisions } from "@datastorified/decision-engine";
import { breadcrumbSchema, canonical, createMetadata, serializeJsonLd } from "@datastorified/seo";
import { DecisionHero } from "../../components/decision/DecisionHero";
import { DecisionSuggestionCard } from "../../components/decision/DecisionSuggestionCard";
import { DecisionRecent } from "../../components/decision/DecisionRecent";
import { decisionHubSeo } from "../../lib/decision-seo";

const url = canonical("datastorified.com", "/decision");

export const metadata = createMetadata(
  decisionHubSeo.title,
  decisionHubSeo.description,
  "datastorified.com",
  "/decision",
);

const schemas = [
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "DataStorified Decision Engine",
    description: "Free decision guides using transparent calculators, rules, weights, risks, and scenarios.",
    url,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: decisions.map((decision, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: decision.title,
        url: canonical("datastorified.com", `/decision/${decision.id}`),
      })),
    },
  },
  breadcrumbSchema([
    { name: "DataStorified", url: canonical("datastorified.com") },
    { name: "Decision Engine", url },
  ]),
];

export default function DecisionLanding() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schemas) }} />
    <Header />
    <main>
      <DecisionHero />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="text-center"><Badge>Popular decisions</Badge><h2 className="mt-4 text-3xl font-bold sm:text-4xl">Start with a decision that matters now</h2><p className="mx-auto mt-3 max-w-2xl text-muted">Each flow uses visible questions, calculator outputs, and configurable rules—not a black-box answer.</p></div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{decisions.map((decision) => <DecisionSuggestionCard key={decision.id} decision={decision} />)}</div>
      </section>
      <DecisionRecent />
      <section className="bg-soft py-16"><div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-3">{[[BrainCircuit, "Decision science first", "Transparent factors and weights produce the recommendation."], [SlidersHorizontal, "Test the assumptions", "What-if controls reveal which variables actually change the answer."], [CheckCircle2, "Leave with a next step", "Every result includes risks, actions, and relevant calculators."]].map(([Icon, title, body]) => { const I = Icon as typeof BrainCircuit; return <Card key={String(title)} className="p-6"><I className="text-primary" /><h3 className="mt-4 text-lg font-bold">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-muted">{String(body)}</p></Card>; })}</div></section>
    </main>
    <Footer />
  </>;
}
