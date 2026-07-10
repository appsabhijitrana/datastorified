"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BellRing, Clock3, Compass, Sparkles, TrendingUp, UserRound, Wallet, BriefcaseBusiness, House, ScanSearch, Phone, CarFront, ShieldCheck, GraduationCap, Landmark, HeartPulse } from "lucide-react";
import {
  getAllDecisions,
  getCategoryRoute,
  getDecisionCategories,
  getDecisionRoute,
  getDecisionsByCategory,
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

type ExploreCollection = {
  title: string;
  eyebrow: string;
  description: string;
  decisionSlugs: string[];
};

const categoryIcons: Record<string, React.ReactNode> = {
  money: <Wallet size={18} />,
  career: <BriefcaseBusiness size={18} />,
  buying: <CarFront size={18} />,
  home: <House size={18} />,
  education: <GraduationCap size={18} />,
  insurance: <ShieldCheck size={18} />,
  travel: <Compass size={18} />,
  business: <Landmark size={18} />,
  lifestyle: <Phone size={18} />,
  "government-schemes": <HeartPulse size={18} />,
};

export function ExploreDiscovery() {
  const allDecisions = useMemo(() => getAllDecisions(), []);
  const liveDecisions = useMemo(() => getLiveDecisions(), []);
  const categories = useMemo(() => getDecisionCategories(), []);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestedPriorities, setSuggestedPriorities] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    setRecentSearches(storage.getSearches());
    setSuggestedPriorities(storage.getDecisionSuggestions());
  }, []);

  const recommendedDecisions = useMemo(() => {
    const seeds = [...recentSearches, ...suggestedPriorities, ...categories.map((category) => category.label).slice(0, 3)];
    const picked = seeds
      .flatMap((query) => searchDecisions(query).slice(0, 2))
      .filter((decision, index, items) => items.findIndex((item) => item.id === decision.id) === index);
    return picked.slice(0, 6);
  }, [categories, recentSearches, suggestedPriorities]);

  const comingSoonDecisions = useMemo(() => allDecisions.filter((decision) => decision.status !== "live"), [allDecisions]);
  const categoryDecisions = useMemo(() => {
    if (activeCategory === "all") return liveDecisions;
    return getDecisionsByCategory(activeCategory);
  }, [activeCategory, liveDecisions]);

  const collections = useMemo<ExploreCollection[]>(() => [
    {
      title: "Money starters",
      eyebrow: "Collection",
      description: "Quick comparisons that help you think through savings and investing.",
      decisionSlugs: ["fd-vs-sip", "emergency-fund", "loan-prepayment"],
    },
    {
      title: "Life pivots",
      eyebrow: "Collection",
      description: "Decisions that affect career momentum, stability, and change.",
      decisionSlugs: ["job-switch", "buy-house", "rent-vs-buy"],
    },
    {
      title: "Fast comparisons",
      eyebrow: "Collection",
      description: "Short decisions that are useful when you want a quick answer.",
      decisionSlugs: ["ev-vs-petrol", "phone-comparison", "buy-car"],
    },
  ], []);

  return (
    <div className="space-y-8 pb-6">
      <section className="overflow-hidden rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/[.07] via-white to-accent/[.08] p-5 shadow-soft sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_380px] lg:items-center">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="inline-flex">Discovery feed</Badge>
              <Badge className="border-border bg-white text-muted">App-store style browsing</Badge>
            </div>
            <PageHeader
              title="Explore decisions"
              description="Search, browse, and compare the most useful decision workflows in a storefront built for quick discovery."
            />
            <div className="rounded-[1.5rem] border border-border/80 bg-white p-3 shadow-soft">
              <DecisionSearch placeholder="Search any decision…" sourceSection="explore_search" />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  selected={activeCategory === category.id}
                  onClick={() => {
                    setActiveCategory((current) => current === category.id ? "all" : category.id);
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
          </div>

          <Card className="overflow-hidden border-primary/15 bg-white/90 p-5 shadow-lift">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Top discovery</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">What people explore most</h2>
                <p className="mt-2 text-sm leading-6 text-muted">Swipe through trending choices, popular comparisons, and fast decision shortcuts.</p>
              </div>
              <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Compass size={18} />
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MiniStat label="Live decisions" value={`${liveDecisions.length}`} icon={<Sparkles size={15} />} />
              <MiniStat label="Trending now" value={`${getTrendingDecisions().length}`} icon={<TrendingUp size={15} />} />
              <MiniStat label="Popular this week" value={`${getPopularDecisions().length}`} icon={<UserRound size={15} />} />
              <MiniStat label="Quick picks" value={`${liveDecisions.filter((item) => item.isQuickDecision).length}`} icon={<Clock3 size={15} />} />
            </div>
          </Card>
        </div>
      </section>

      <RailSection title="Trending decisions" eyebrow="Trending" items={getTrendingDecisions().slice(0, 6)} />
      <RailSection title="Recommended for you" eyebrow="Personalized" items={recommendedDecisions.length ? recommendedDecisions : liveDecisions.slice(0, 6)} />
      <RailSection title="Popular this week" eyebrow="Popular" items={getPopularDecisions().slice(0, 6)} />
      <RailSection title="New decisions" eyebrow="Fresh" items={liveDecisions.slice(-6)} />

      <section className="space-y-4">
        <SectionHeader
          eyebrow="Category cards"
          title="Browse by category"
          description="Choose a category when you want the fastest route to a relevant workflow."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <CategoryTile
              key={category.id}
              label={category.label}
              description={category.description}
              href={getCategoryRoute(category.id) ?? `/category/${category.id}`}
              icon={categoryIcons[category.id] ?? <ScanSearch size={18} />}
              decisionCount={getDecisionsByCategory(category.id).length}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          eyebrow="Decision collections"
          title="Curated collections"
          description="Collections group related decisions so users can browse by intent, not just by label."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard key={collection.title} collection={collection} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader eyebrow="Category filters" title="Category filters" description="Refine the storefront without losing the discovery flow." />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="p-5">
            <div className="flex flex-wrap gap-2">
              <Chip selected={activeCategory === "all"} onClick={() => setActiveCategory("all")}>All</Chip>
              {categories.map((category) => (
                <Chip key={category.id} selected={activeCategory === category.id} onClick={() => setActiveCategory(category.id)}>
                  {category.label}
                </Chip>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Active filter</p>
            <p className="mt-2 text-lg font-bold">{activeCategory === "all" ? "All categories" : categories.find((category) => category.id === activeCategory)?.label ?? "All categories"}</p>
            <p className="mt-2 text-sm leading-6 text-muted">Showing {categoryDecisions.length} live decisions from the current registry.</p>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          eyebrow="Filtered decisions"
          title="Decision cards"
          description="These cards use the current category filter and keep the CTA route-safe."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categoryDecisions.slice(0, 6).map((decision) => (
            <DecisionFeedCard key={decision.id} decision={decision} sourceSection={`category_filter_${activeCategory}`} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader eyebrow="Coming soon" title="Coming soon decisions" description="Visible in the storefront, but they never route to broken pages." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {comingSoonDecisions.length ? comingSoonDecisions.slice(0, 6).map((decision) => (
            <ComingSoonCard
              key={decision.id}
              decision={decision}
              onRefresh={() => setSuggestedPriorities(storage.getDecisionSuggestions())}
            />
          )) : <ComingSoonFallback />}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader eyebrow="Trending searches" title="Trending searches" description="Use these as shortcuts into the discovery feed." />
        <div className="flex flex-wrap gap-2">
          {["FD vs SIP", "Should I buy a house?", "EV vs Petrol", "Change job", "Phone comparison", "Emergency fund", "Term insurance"].map((query) => (
            <Chip key={query} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>{query}</Chip>
          ))}
        </div>
      </section>

      <RecommendedDecisionRail onProfileNudge={() => window.location.assign("/profile")} />
    </div>
  );
}

function RailSection({ title, eyebrow, items }: { title: string; eyebrow: string; items: DiscoveryDecision[] }) {
  return (
    <section className="space-y-4">
      <SectionHeader eyebrow={eyebrow} title={title} description="Fast, swipeable cards on mobile and a wider grid on desktop." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((decision) => (
          <DecisionFeedCard key={decision.id} decision={decision} sourceSection={title.toLowerCase().replace(/\s+/g, "_")} />
        ))}
      </div>
    </section>
  );
}

function DecisionFeedCard({ decision, sourceSection }: { decision: DiscoveryDecision; sourceSection: string }) {
  const href = getDecisionRoute(decision.slug);
  const popularityUsers = Math.max(120, Math.round(decision.popularityScore * 18));
  return (
    <Card className="flex min-w-0 flex-1 flex-col gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <CardIcon decision={decision} />
          <Badge>{decision.category}</Badge>
        </div>
        <StatusPill status={decision.status} />
      </div>
      <div>
        <h3 className="text-lg font-bold">{decision.title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{decision.description}</p>
      </div>
      <div className="grid gap-2 text-sm text-muted sm:grid-cols-2">
        <MetaLine label="Popularity" value={`${popularityUsers.toLocaleString("en-IN")} users`} />
        <MetaLine label="Score" value={`${decision.popularityScore}/100`} />
        <MetaLine label="Time" value={decision.estimatedTime} />
        <MetaLine label="Tags" value={decision.tags.slice(0, 2).join(" · ") || "Decision"} />
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

function CategoryTile({ label, description, href, icon, decisionCount }: { label: string; description: string; href: string; icon: React.ReactNode; decisionCount: number }) {
  return (
    <Link href={href} className="block h-full">
      <Card className="flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
        <div className="flex items-start justify-between gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">{icon}</span>
          <Badge className="border-border bg-soft text-muted">{decisionCount} decisions</Badge>
        </div>
        <h3 className="mt-4 text-xl font-bold">{label}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
        <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-primary">
          Explore {label} <ArrowRight size={16} />
        </span>
      </Card>
    </Link>
  );
}

function CollectionCard({ collection }: { collection: ExploreCollection }) {
  const decisions = collection.decisionSlugs
    .map((slug) => getLiveDecisions().find((decision) => decision.slug === slug))
    .filter((item): item is DiscoveryDecision => Boolean(item));

  return (
    <Card className="flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <Badge>{collection.eyebrow}</Badge>
        <span className="text-xs font-semibold text-muted">{decisions.length} decisions</span>
      </div>
      <h3 className="mt-4 text-xl font-bold">{collection.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{collection.description}</p>
      <div className="mt-4 space-y-2">
        {decisions.map((decision) => (
          <Link key={decision.id} href={getDecisionRoute(decision.slug) ?? "#"} className="flex items-center justify-between rounded-2xl border border-border bg-white px-3 py-3 text-sm font-semibold text-ink transition hover:border-primary/20 hover:text-primary">
            <span className="truncate">{decision.shortTitle}</span>
            <ArrowRight size={14} />
          </Link>
        ))}
      </div>
    </Card>
  );
}

function ComingSoonCard({ decision, onRefresh }: { decision: DiscoveryDecision; onRefresh: () => void }) {
  const popularityUsers = Math.max(120, Math.round(decision.popularityScore * 18));
  return (
    <Card className="flex flex-col gap-4 border-dashed border-primary/20 bg-soft/30 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <CardIcon decision={decision} />
          <Badge>{decision.category}</Badge>
        </div>
        <StatusPill status={decision.status} />
      </div>
      <div>
        <h3 className="text-lg font-bold">{decision.title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{decision.description}</p>
      </div>
      <div className="grid gap-2 text-sm text-muted sm:grid-cols-2">
        <MetaLine label="Popularity" value={`${popularityUsers.toLocaleString("en-IN")} users`} />
        <MetaLine label="Score" value={`${decision.popularityScore}/100`} />
        <MetaLine label="Time" value={decision.estimatedTime} />
        <MetaLine label="Tags" value={decision.tags.slice(0, 2).join(" · ") || "Decision"} />
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        <Button variant="secondary" disabled>Coming soon</Button>
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

function CardIcon({ decision }: { decision: DiscoveryDecision }) {
  return <span className="grid size-10 place-items-center rounded-2xl bg-soft text-primary">{categoryIcons[slugToCategoryKey(decision.category)] ?? <ScanSearch size={16} />}</span>;
}

function slugToCategoryKey(category: string) {
  return category.toLowerCase().replace(/\s+/g, "-");
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white px-3 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[.14em] text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-muted">{label}</p>
        <span className="text-primary">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
