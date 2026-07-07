"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BellRing, Clock3, Sparkles } from "lucide-react";
import { getCategoryRoute, getDecisionRoute, searchDecisions, type DecisionCategoryEntry, type DiscoveryDecision } from "@datastorified/decision-os";
import { Badge, Button, Card, PageHeader, SearchInput, SectionHeader } from "@datastorified/ui/design-system";
import { storage } from "@datastorified/storage";

export function CategoryDiscovery({
  category,
  liveDecisions,
  comingSoonIdeas,
  relatedCategories,
}: {
  category: DecisionCategoryEntry;
  liveDecisions: DiscoveryDecision[];
  comingSoonIdeas: DiscoveryDecision[];
  relatedCategories: DecisionCategoryEntry[];
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim();

  const filteredLive = useMemo(() => {
    if (!normalizedQuery) return liveDecisions;
    const matches = searchDecisions(normalizedQuery);
    return matches.filter((decision) => decision.category === category.label || decision.subcategory === category.label || decision.tags.join(" ").toLowerCase().includes(category.label.toLowerCase()));
  }, [category.label, liveDecisions, normalizedQuery]);

  const topDecisions = filteredLive.filter((decision) => !decision.isQuickDecision).slice(0, 6);
  const quickDecisions = filteredLive.filter((decision) => decision.isQuickDecision).slice(0, 6);
  const popularComparisons = filteredLive.filter((decision) => decision.isPopular).slice(0, 6);

  return (
    <div className="space-y-8 pb-6">
      <section className="space-y-4">
        <Badge>{category.label}</Badge>
        <PageHeader title={`${category.label} decisions`} description={category.description} />
        <SearchInput
          aria-label={`Search ${category.label} decisions`}
          placeholder={`Search within ${category.label.toLowerCase()}…`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </section>

      {filteredLive.length ? (
        <>
          <DiscoveryRail title="Top decisions" eyebrow="Category" decisions={topDecisions.length ? topDecisions : filteredLive.slice(0, 6)} />
          <DiscoveryRail title="Quick decisions" eyebrow="Category" decisions={quickDecisions.length ? quickDecisions : filteredLive.slice(0, 6)} />
          <DiscoveryRail title="Popular comparisons" eyebrow="Category" decisions={popularComparisons.length ? popularComparisons : filteredLive.slice(0, 6)} />
        </>
      ) : (
        <EmptyCategory category={category.label} />
      )}

      <section className="space-y-4">
        <SectionHeader eyebrow="Related categories" title="Related categories" description="Move sideways when this category feels too broad." />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {relatedCategories.map((item) => (
            <Card key={item.id} className="p-5">
              <Badge>{item.label}</Badge>
              <h3 className="mt-3 text-lg font-bold">{item.label}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
              <Link href={getCategoryRoute(item.id) ?? `/category/${item.id}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Explore {item.label} <ArrowRight size={16} />
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader eyebrow="Coming soon ideas" title="Coming soon ideas" description="Visible ideas that stay safe until live workflows exist." />
        {comingSoonIdeas.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {comingSoonIdeas.map((decision) => (
              <ComingSoonCard key={decision.id} title={decision.title} description={decision.description} />
            ))}
          </div>
        ) : (
          <Card className="p-6">
            <p className="font-semibold">No coming soon ideas yet.</p>
            <p className="mt-1 text-sm leading-6 text-muted">This category currently has only live decision flows.</p>
          </Card>
        )}
      </section>
    </div>
  );
}

function DiscoveryRail({ title, eyebrow, decisions }: { title: string; eyebrow: string; decisions: DiscoveryDecision[] }) {
  return (
    <section className="space-y-4">
      <SectionHeader eyebrow={eyebrow} title={title} description="Swipe on mobile, grid on desktop." />
      <div className="flex gap-4 overflow-x-auto pb-1 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:overflow-visible">
        {decisions.map((decision) => <DecisionCard key={decision.id} decision={decision} />)}
      </div>
    </section>
  );
}

function DecisionCard({ decision }: { decision: DiscoveryDecision }) {
  const href = getDecisionRoute(decision.slug);
  return (
    <Card className="flex min-w-72 flex-1 flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <Badge>{decision.category}</Badge>
        <Badge className="border-border bg-soft text-muted">{decision.tags[0] ?? "Decision"}</Badge>
      </div>
      <div>
        <h3 className="text-lg font-bold">{decision.title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{decision.description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
        <span className="inline-flex items-center gap-1"><Clock3 size={14} /> {decision.estimatedTime}</span>
        <span>{decision.factorCount} factors</span>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[.14em] text-primary">{decision.shortTitle}</span>
        {href ? (
          <Link href={href}>
            <Button variant="secondary">Start <ArrowRight size={16} /></Button>
          </Link>
        ) : (
          <Button variant="secondary" disabled>Coming soon</Button>
        )}
      </div>
    </Card>
  );
}

function ComingSoonCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="flex flex-col gap-3 border-dashed border-primary/20 bg-soft/30 p-5">
      <div className="flex items-start justify-between gap-3">
        <Badge>Coming soon</Badge>
        <Button variant="ghost" onClick={() => storage.addDecisionSuggestion(title)}>
          <BellRing size={16} />
          Suggest priority
        </Button>
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-sm leading-6 text-muted">{description}</p>
      <Button variant="secondary" disabled>Start</Button>
    </Card>
  );
}

function EmptyCategory({ category }: { category: string }) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Sparkles size={18} /></span>
        <div className="space-y-3">
          <h3 className="text-lg font-bold">No live decisions in {category} yet</h3>
          <p className="text-sm leading-6 text-muted">You can still suggest a decision and we’ll keep it locally.</p>
          <Button variant="secondary" onClick={() => storage.addDecisionSuggestion(`${category} decision idea`)}>
            Suggest this decision
          </Button>
        </div>
      </div>
    </Card>
  );
}
