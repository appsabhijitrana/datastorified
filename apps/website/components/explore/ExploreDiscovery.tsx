"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { decisionPluginRegistry } from "@datastorified/decision-os";
import { Badge, Button, Card, Chip, EmptyState, PageHeader, SearchInput, SectionHeader } from "@datastorified/ui/design-system";
import { storage } from "@datastorified/storage";
import { decisionRouteFromText } from "../../lib/decision-routing";

type ExploreCard = {
  title: string;
  description: string;
  category: string;
  time: string;
  factors: number;
  query: string;
};

const categoryLabels = [
  "Money",
  "Career",
  "Buying",
  "Home",
  "Education",
  "Insurance",
  "Travel",
  "Business",
  "Lifestyle",
  "Government Schemes",
];

const sections: Array<{ title: string; items: ExploreCard[] }> = [
  {
    title: "Trending decisions",
    items: [
      { title: "EV vs Petrol", description: "Compare running cost, range, resale, and charging convenience.", category: "Buying", time: "4 min", factors: 6, query: "EV vs Petrol" },
      { title: "Govt Job vs Private Job", description: "Compare stability, salary growth, lifestyle, and long-term fit.", category: "Career", time: "5 min", factors: 7, query: "Govt Job vs Private Job" },
      { title: "Buy House vs Rent", description: "Compare affordability, flexibility, and long-term ownership trade-offs.", category: "Home", time: "5 min", factors: 7, query: "Buy House vs Rent" },
      { title: "SIP vs Lump Sum", description: "Match market timing risk with your investing style and horizon.", category: "Money", time: "3 min", factors: 5, query: "SIP vs Lump Sum" },
      { title: "iPhone vs Android", description: "Compare ecosystem, budget, longevity, and use-case fit.", category: "Lifestyle", time: "2 min", factors: 4, query: "iPhone vs Android" },
    ],
  },
  {
    title: "Quick 2-minute decisions",
    items: [
      { title: "Emergency Fund Check", description: "See if your cash buffer is strong enough for shocks.", category: "Money", time: "2 min", factors: 4, query: "Emergency Fund Check" },
      { title: "Term Insurance Need", description: "Judge whether your protection is enough for dependants and debt.", category: "Insurance", time: "2 min", factors: 4, query: "Term Insurance Need" },
      { title: "Phone Upgrade Decision", description: "Decide whether to upgrade now or wait.", category: "Lifestyle", time: "2 min", factors: 4, query: "Phone Upgrade Decision" },
      { title: "Credit Card Fit", description: "Check whether a card matches your spending and repayment style.", category: "Money", time: "2 min", factors: 4, query: "Credit Card Fit" },
    ],
  },
  {
    title: "Most compared",
    items: [
      { title: "FD vs SIP", description: "Choose between fixed return stability and market-linked growth.", category: "Money", time: "3 min", factors: 5, query: "FD vs SIP" },
      { title: "Rent vs Buy", description: "Compare ownership cost against staying flexible.", category: "Home", time: "5 min", factors: 7, query: "Rent vs Buy" },
      { title: "PPF vs NPS", description: "Compare retirement saving vehicles and tax treatment.", category: "Money", time: "4 min", factors: 6, query: "PPF vs NPS" },
      { title: "Gold vs Mutual Fund", description: "Compare inflation protection, liquidity, and growth potential.", category: "Money", time: "4 min", factors: 6, query: "Gold vs Mutual Fund" },
    ],
  },
];

function getWorkflow(query: string) {
  return decisionPluginRegistry.detectWorkflowFromText(query) ?? decisionPluginRegistry.searchWorkflows(query, 1)[0];
}

function getRoute(query: string) {
  return decisionRouteFromText(query) ?? "/decision";
}

export function ExploreDiscovery() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>(() => storage.getDecisionSuggestions());
  const [submitted, setSubmitted] = useState(false);

  const normalizedQuery = query.trim().toLowerCase();
  const queryResults = useMemo(() => {
    if (!normalizedQuery) return [];
    const cards = sections.flatMap((section) => section.items);
    return cards.filter((card) => {
      const haystack = [card.title, card.description, card.category].join(" ").toLowerCase();
      return haystack.includes(normalizedQuery) || normalizedQuery.split(/\s+/u).every((token) => haystack.includes(token));
    });
  }, [normalizedQuery]);

  const handleSuggest = () => {
    const value = query.trim();
    if (!value) return;
    storage.addDecisionSuggestion(value);
    setSuggestions(storage.getDecisionSuggestions());
    setSubmitted(true);
  };

  const renderCard = (card: ExploreCard) => {
    const workflow = getWorkflow(card.query);
    const route = getRoute(card.query);
    return (
      <Card key={card.title} className="p-5">
        <div className="flex items-start justify-between gap-3">
          <Badge>{card.category}</Badge>
          <span className="text-xs font-semibold text-muted">{card.factors} factors</span>
        </div>
        <h3 className="mt-3 text-lg font-bold">{workflow?.title ?? card.title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{card.description}</p>
        <div className="mt-4 flex items-center gap-4 text-sm text-muted">
          <span className="inline-flex items-center gap-1"><Clock3 size={14} /> {card.time}</span>
          <span>{card.category}</span>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-muted">{card.factors} factor checks</span>
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
