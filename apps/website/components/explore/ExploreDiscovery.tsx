"use client";

import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { getDecisionCategories, getDecisionRoute, getLiveDecisions, type DiscoveryDecision } from "@datastorified/decision-os";
import { Badge, Button, Card, Chip, PageHeader, SectionHeader } from "@datastorified/ui/design-system";
import { DecisionSearch } from "../decision/DecisionSearch";
const categoryLabels = getDecisionCategories().map((category) => category.label);

const sections: Array<{ title: string; items: DiscoveryDecision[] }> = [
  { title: "Trending decisions", items: getLiveDecisions().filter((decision) => decision.isTrending).slice(0, 5) },
  { title: "Quick 2-minute decisions", items: getLiveDecisions().filter((decision) => decision.isQuickDecision).slice(0, 4) },
  { title: "Most compared", items: getLiveDecisions().filter((decision) => decision.isPopular).slice(0, 4) },
];

export function ExploreDiscovery() {
  const renderCard = (decision: DiscoveryDecision) => {
    const route = getDecisionRoute(decision.slug);
    return (
      <Card key={decision.id} className="p-5">
        <div className="flex items-start justify-between gap-3">
          <Badge>{decision.category}</Badge>
          <span className="text-xs font-semibold text-muted">{decision.factorCount} factors</span>
        </div>
        <h3 className="mt-3 text-lg font-bold">{decision.title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{decision.description}</p>
        <div className="mt-4 flex items-center gap-4 text-sm text-muted">
          <span className="inline-flex items-center gap-1"><Clock3 size={14} /> {decision.estimatedTime}</span>
          <span>{decision.subcategory ?? decision.category}</span>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-muted">{decision.factorCount} factor checks</span>
          {route ? (
            <Link href={route}>
              <Button variant="secondary">Start <ArrowRight size={16} /></Button>
            </Link>
          ) : (
            <Button variant="secondary" disabled>Coming soon</Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-8 pb-6">
      <section className="space-y-4">
        <PageHeader
          title="Explore decisions"
          description="Browse the decision library, search naturally, and jump into the right workflow faster."
        />
        <DecisionSearch placeholder="Search decisions like FD vs SIP, buy a house, change job…" />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categoryLabels.map((category) => (
            <Chip key={category} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="whitespace-nowrap">{category}</Chip>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader eyebrow="Category grid" title="Category grid" description="Start with a category when you are not sure what to search." />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categoryLabels.map((category) => (
            <Card key={category} className="p-5">
              <Badge>{category}</Badge>
              <h3 className="mt-3 text-lg font-bold">{category}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">Browse decision flows around {category.toLowerCase()}.</p>
              <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Explore {category} <ArrowRight size={16} />
              </button>
            </Card>
          ))}
        </div>
      </section>

      {sections.map((section) => (
        <section key={section.title} className="space-y-4">
          <SectionHeader eyebrow="Discovery" title={section.title} description="Fast, high-intent decision cards." />
          <div className="flex gap-4 overflow-x-auto pb-1 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:overflow-visible">
            {section.items.map((card) => renderCard(card))}
          </div>
        </section>
      ))}
    </div>
  );
}
