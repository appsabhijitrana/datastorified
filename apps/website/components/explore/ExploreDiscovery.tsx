"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { getDecisionCategories, getDecisionRoute, getLiveDecisions, searchDecisions, type DiscoveryDecision } from "@datastorified/decision-os";
import { Badge, Button, Card, Chip, EmptyState, PageHeader, SearchInput, SectionHeader } from "@datastorified/ui/design-system";
import { storage } from "@datastorified/storage";
const categoryLabels = getDecisionCategories().map((category) => category.label);

const sections: Array<{ title: string; items: DiscoveryDecision[] }> = [
  { title: "Trending decisions", items: getLiveDecisions().filter((decision) => decision.isTrending).slice(0, 5) },
  { title: "Quick 2-minute decisions", items: getLiveDecisions().filter((decision) => decision.isQuickDecision).slice(0, 4) },
  { title: "Most compared", items: getLiveDecisions().filter((decision) => decision.isPopular).slice(0, 4) },
];

export function ExploreDiscovery() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>(() => storage.getDecisionSuggestions());
  const [submitted, setSubmitted] = useState(false);

  const normalizedQuery = query.trim().toLowerCase();
  const queryResults = useMemo(() => (normalizedQuery ? searchDecisions(query) : []), [normalizedQuery, query]);

  const handleSuggest = () => {
      const value = query.trim();
      if (!value) return;
      storage.addDecisionSuggestion(value);
    setSuggestions(storage.getDecisionSuggestions());
    setSubmitted(true);
  };

  const renderCard = (decision: DiscoveryDecision) => {
    const route = getDecisionRoute(decision.slug);
    if (!route) {
      return (
        <Card key={decision.id} className="p-5">
          <div className="flex items-start justify-between gap-3">
            <Badge>{decision.category}</Badge>
            <span className="text-xs font-semibold text-muted">Coming soon</span>
          </div>
          <h3 className="mt-3 text-lg font-bold">{decision.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{decision.description}</p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-muted">{decision.factorCount} factor checks</span>
            <Button variant="secondary" disabled>Coming soon</Button>
          </div>
        </Card>
      );
    }
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
          <Link href={route}>
            <Button variant="secondary">Start <ArrowRight size={16} /></Button>
          </Link>
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
        <SearchInput
          aria-label="Search decisions"
          placeholder="Search decisions like FD vs SIP, buy a house, change job…"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setSubmitted(false); }}
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categoryLabels.map((category) => (
            <Chip key={category} onClick={() => setQuery(category)} className="whitespace-nowrap">{category}</Chip>
          ))}
        </div>
      </section>

      {normalizedQuery ? (
        <section className="space-y-4">
          <SectionHeader eyebrow="Search results" title={`Results for “${query.trim()}”`} description="Local fuzzy search over the current decision library." />
          {queryResults.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {queryResults.map(renderCard)}
            </div>
          ) : (
            <Card className="p-6">
              <EmptyState
                title={submitted ? "We do not have this decision yet" : "No matching decisions"}
                description="Try another phrase, or suggest a decision and we’ll keep it locally for later."
                action={<Button variant="secondary" onClick={handleSuggest}>Suggest this decision</Button>}
              />
            </Card>
          )}
        </section>
      ) : (
        <>
          <section className="space-y-4">
          <SectionHeader eyebrow="Category grid" title="Category grid" description="Start with a category when you are not sure what to search." />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {categoryLabels.map((category) => (
              <Card key={category} className="p-5">
                  <Badge>{category}</Badge>
                  <h3 className="mt-3 text-lg font-bold">{category}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">Browse decision flows around {category.toLowerCase()}.</p>
                  <button type="button" onClick={() => setQuery(category)} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
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

          {suggestions.length > 0 && (
            <section className="space-y-4">
              <SectionHeader eyebrow="Your ideas" title="Recently suggested" description="Suggestions you’ve entered are stored locally on this device." />
              <div className="flex gap-3 overflow-x-auto pb-1">
              {suggestions.map((item) => (
                <Card key={item} className="min-w-56 p-4">
                  <p className="text-sm font-semibold">{item}</p>
                    <p className="mt-1 text-xs text-muted">Saved locally</p>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
