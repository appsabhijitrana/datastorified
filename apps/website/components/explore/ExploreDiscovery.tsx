"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BellRing, Clock3, Sparkles } from "lucide-react";
import {
  getAllDecisions,
  getCategoryRoute,
  getDecisionCategories,
  getDecisionRoute,
  getLiveDecisions,
  getPopularDecisions,
  getTrendingDecisions,
  searchDecisions,
  type DiscoveryDecision,
} from "@datastorified/decision-os";
import { Badge, Button, Card, Chip, PageHeader, SectionHeader } from "@datastorified/ui/design-system";
import { storage } from "@datastorified/storage";
import { DecisionSearch } from "../decision/DecisionSearch";
import { RecommendedDecisionRail } from "../recommendations/RecommendationFeed";
import { trackDiscoveryEvent } from "@datastorified/analytics";

const curatedTrending = ["EV vs Petrol", "Should I buy a house?", "Should I switch jobs?", "FD vs SIP", "Rent vs Buy"];
const quickQueries = ["Emergency Fund", "Term Insurance", "Phone Comparison", "Job Switch"];

export function ExploreDiscovery() {
  const allDecisions = useMemo(() => getAllDecisions(), []);
  const liveDecisions = useMemo(() => getLiveDecisions(), []);
  const categories = useMemo(() => getDecisionCategories(), []);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestedPriorities, setSuggestedPriorities] = useState<string[]>([]);

  useEffect(() => {
    setRecentSearches(storage.getSearches());
    setSuggestedPriorities(storage.getDecisionSuggestions());
  }, []);

  const recommendedDecisions = useMemo(() => {
    const seeds = [...recentSearches, ...suggestedPriorities, "money", "career", "home"];
    const picked = seeds
      .flatMap((query) => searchDecisions(query).slice(0, 2))
      .filter((decision, index, items) => items.findIndex((item) => item.id === decision.id) === index);
    return picked.slice(0, 6);
  }, [recentSearches, suggestedPriorities]);

  const comingSoonDecisions = useMemo(() => allDecisions.filter((decision) => decision.status !== "live"), [allDecisions]);

  return (
    <div className="space-y-8 pb-6">
      <section className="space-y-4">
        <PageHeader
          title="Explore decisions"
          description="Browse the decision library like a discovery feed and jump into the right workflow faster."
        />
        <div className="sticky top-2 z-10 -mx-4 px-4 sm:static sm:mx-0 sm:px-0">
          <DecisionSearch placeholder="Search any decision…" sourceSection="explore_search" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => (
            <Chip
              key={category.id}
              onClick={() => {
                trackDiscoveryEvent("category_clicked", {
                  category: category.label,
                  source_section: "explore_category_chip",
                  device_type: typeof window === "undefined" ? "unknown" : window.innerWidth < 768 ? "mobile" : "desktop",
                });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="whitespace-nowrap"
            >
              {category.label}
            </Chip>
          ))}
        </div>
      </section>

      <RailSection title="Trending now" eyebrow="Discovery" items={getTrendingDecisions().slice(0, 6)} />
      <RailSection title="Quick 2-minute decisions" eyebrow="Discovery" items={liveDecisions.filter((decision) => decision.isQuickDecision).slice(0, 6)} />
      <RailSection title="Popular comparisons" eyebrow="Discovery" items={getPopularDecisions().slice(0, 6)} />

      <RecommendedDecisionRail onProfileNudge={() => window.location.assign("/profile")} />

      <section className="space-y-4">
        <SectionHeader eyebrow="Categories" title="Categories" description="Start with a large category tile when you are not sure what to search." />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <CategoryTile
              key={category.id}
              label={category.label}
              description={category.description}
              href={getCategoryRoute(category.id) ?? `/category/${category.id}`}
            />
          ))}
        </div>
      </section>

      <RailSection title="Recommended for you" eyebrow="Personalized" items={recommendedDecisions.length ? recommendedDecisions : liveDecisions.slice(0, 6)} />

      <section className="space-y-4">
        <SectionHeader eyebrow="Recently added" title="Recently added" description="Freshly surfaced decisions from the registry." />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {liveDecisions.slice(-6).map((decision) => (
            <DecisionFeedCard key={decision.id} decision={decision} sourceSection="recently_added" />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader eyebrow="Coming soon" title="Coming soon" description="These are visible, but never route to broken pages." />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {comingSoonDecisions.length ? comingSoonDecisions.slice(0, 6).map((decision) => <ComingSoonCard key={decision.id} decision={decision} onRefresh={() => setSuggestedPriorities(storage.getDecisionSuggestions())} />) : <ComingSoonFallback />}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader eyebrow="Trending searches" title="Trending searches" description="Tap a search to jump into the discovery flow." />
        <div className="flex flex-wrap gap-2">
          {curatedTrending.map((query) => (
            <Chip key={query} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>{query}</Chip>
          ))}
          {quickQueries.map((query) => (
            <Chip key={query} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>{query}</Chip>
          ))}
        </div>
      </section>
    </div>
  );
}

function RailSection({ title, eyebrow, items }: { title: string; eyebrow: string; items: DiscoveryDecision[] }) {
  return (
    <section className="space-y-4">
      <SectionHeader eyebrow={eyebrow} title={title} description="Fast, swipeable cards on mobile and a wider grid on desktop." />
      <div className="flex gap-4 overflow-x-auto pb-1 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:overflow-visible">
        {items.map((decision) => <DecisionFeedCard key={decision.id} decision={decision} sourceSection={title.toLowerCase().replace(/\s+/g, "_")} />)}
      </div>
    </section>
  );
}

function DecisionFeedCard({ decision, sourceSection }: { decision: DiscoveryDecision; sourceSection: string }) {
  const href = getDecisionRoute(decision.slug);
  return (
    <Card className="flex min-w-72 flex-1 flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <Badge>{decision.category}</Badge>
        <StatusPill status={decision.status} />
      </div>
      <div>
        <h3 className="text-lg font-bold">{decision.title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{decision.description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
        <span className="inline-flex items-center gap-1"><Clock3 size={14} /> {decision.estimatedTime}</span>
        <span>{decision.factorCount} factors</span>
        <Badge className="border-border bg-soft text-muted">{decision.tags[0] ?? "Decision"}</Badge>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[.14em] text-primary">{decision.shortTitle}</span>
        {href ? (
          <Link
            href={href}
            onClick={() => {
              trackDiscoveryEvent("decision_card_clicked", {
                decision_slug: decision.slug,
                category: decision.category,
                source_section: sourceSection,
                device_type: typeof window === "undefined" ? "unknown" : window.innerWidth < 768 ? "mobile" : "desktop",
              });
              trackDiscoveryEvent("decision_started", {
                decision_slug: decision.slug,
                category: decision.category,
                source_section: sourceSection,
                device_type: typeof window === "undefined" ? "unknown" : window.innerWidth < 768 ? "mobile" : "desktop",
              });
            }}
          >
            <Button variant="secondary">Start <ArrowRight size={16} /></Button>
          </Link>
        ) : (
          <Button variant="secondary" disabled>Coming soon</Button>
        )}
      </div>
    </Card>
  );
}

function CategoryTile({ label, description, href }: { label: string; description: string; href: string }) {
  return (
    <Card className="min-h-36 overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <Badge>{label}</Badge>
        <span className="text-xs font-semibold text-muted">{description}</span>
      </div>
      <h3 className="mt-4 text-xl font-bold">{label}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      <Link
        href={href}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary"
        onClick={() => {
          trackDiscoveryEvent("category_clicked", {
            category: label,
            source_section: "explore_category_tile",
            device_type: typeof window === "undefined" ? "unknown" : window.innerWidth < 768 ? "mobile" : "desktop",
          });
        }}
      >
        Explore {label} <ArrowRight size={16} />
      </Link>
    </Card>
  );
}

function ComingSoonCard({ decision, onRefresh }: { decision: DiscoveryDecision; onRefresh: () => void }) {
  return (
    <Card className="flex flex-col gap-4 border-dashed border-primary/20 bg-soft/30 p-5">
      <div className="flex items-start justify-between gap-3">
        <Badge>{decision.category}</Badge>
        <StatusPill status={decision.status} />
      </div>
      <div>
        <h3 className="text-lg font-bold">{decision.title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{decision.description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
        <span className="inline-flex items-center gap-1"><Clock3 size={14} /> {decision.estimatedTime}</span>
        <span>{decision.factorCount} factors</span>
        <Badge className="border-border bg-soft text-muted">{decision.tags[0] ?? "Decision"}</Badge>
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled
          onClick={() => {
            trackDiscoveryEvent("decision_suggested", {
              decision_slug: decision.slug,
              category: decision.category,
              source_section: "explore_coming_soon",
              device_type: typeof window === "undefined" ? "unknown" : window.innerWidth < 768 ? "mobile" : "desktop",
            });
          }}
        >
          Start
        </Button>
        <Button variant="ghost" onClick={onRefresh}>
          <BellRing size={16} />
          Notify me
        </Button>
      </div>
    </Card>
  );
}

function ComingSoonFallback() {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Sparkles size={18} /></span>
        <div>
          <h3 className="text-lg font-bold">More decisions are on the way</h3>
          <p className="mt-2 text-sm leading-6 text-muted">As new flows get added to the registry, they will show up here automatically.</p>
        </div>
      </div>
    </Card>
  );
}

function StatusPill({ status }: { status: DiscoveryDecision["status"] }) {
  if (status === "live") return <Badge className="border-emerald-500/15 bg-emerald-500/10 text-emerald-700">Live</Badge>;
  if (status === "draft") return <Badge className="border-amber-500/15 bg-amber-500/10 text-amber-700">Draft</Badge>;
  return <Badge className="border-border bg-soft text-muted">Coming soon</Badge>;
}
