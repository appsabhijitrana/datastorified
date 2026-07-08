"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, Flame, Gauge, Star, TrendingUp, Users } from "lucide-react";
import {
  getDecisionCategories,
  getDecisionRoute,
  getLiveDecisions,
  getPopularDecisions,
  getTrendingDecisions,
  type DiscoveryDecision,
} from "@datastorified/decision-os";
import { Badge, Button, Card, Chip, PageHeader, SectionHeader } from "@datastorified/ui/design-system";
import { MiniLineChart, ProgressRing } from "@datastorified/ui/library";

type SortTab = "popular" | "top-rated" | "score" | "trending";
type TimeFilter = "all" | "7d" | "30d" | "90d";

export function RankingsDashboard() {
  const liveDecisions = useMemo(() => getLiveDecisions(), []);
  const categories = useMemo(() => getDecisionCategories(), []);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeSort, setActiveSort] = useState<SortTab>("popular");
  const [activeTime, setActiveTime] = useState<TimeFilter>("30d");

  const filtered = useMemo(() => {
    const byCategory = activeCategory === "all" ? liveDecisions : liveDecisions.filter((decision) => categoryMatches(decision.category, activeCategory));
    return sortDecisions(byCategory, activeSort).map((decision, index) => ({
      decision,
      rank: index + 1,
      rating: deriveRating(decision),
      score: deriveScore(decision),
      users: deriveUsers(decision, activeTime),
      trendSeries: buildTrendSeries(decision, activeTime),
    }));
  }, [activeCategory, activeSort, activeTime, liveDecisions]);

  const topThree = filtered.slice(0, 3);

  return (
    <div className="space-y-8 pb-6">
      <section className="overflow-hidden rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/[.07] via-white to-accent/[.08] p-5 shadow-soft sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_360px] lg:items-center">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="inline-flex">Decision rankings</Badge>
              <Badge className="border-border bg-white text-muted">Modern dashboard</Badge>
            </div>
            <PageHeader
              title="Decision rankings"
              description="Compare decision workflows with category filters, sort tabs, and a dashboard-style ranking table."
            />
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  selected={activeCategory === category.id}
                  onClick={() => setActiveCategory((current) => current === category.id ? "all" : category.id)}
                >
                  {category.label}
                </Chip>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <KpiCard label="Live decisions" value={`${liveDecisions.length}`} icon={<Gauge size={16} />} />
            <KpiCard label="Trending" value={`${getTrendingDecisions().length}`} icon={<TrendingUp size={16} />} />
            <KpiCard label="Popular" value={`${getPopularDecisions().length}`} icon={<Flame size={16} />} />
            <KpiCard label="Categories" value={`${categories.length}`} icon={<Star size={16} />} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeader eyebrow="Filters" title="Sort and time filters" description="Switch between ranking views and recent time windows." />
            <div className="flex flex-wrap gap-2">
              {timeFilters.map((item) => (
                <FilterPill key={item.id} label={item.label} selected={activeTime === item.id} onClick={() => setActiveTime(item.id)} />
              ))}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {sortTabs.map((item) => (
              <FilterPill key={item.id} label={item.label} selected={activeSort === item.id} onClick={() => setActiveSort(item.id)} />
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Ranking context</p>
          <p className="mt-2 text-sm leading-6 text-muted">Top 3 badges, score bars, rating, and trend mini charts are shown per card. Mobile switches to stacked cards automatically.</p>
        </Card>
      </section>

      <section className="space-y-4">
        <SectionHeader eyebrow="Rankings" title="Ranking table" description="A table/card hybrid on desktop and stacked cards on mobile." />
        <div className="hidden overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-soft lg:block">
          <div className="grid grid-cols-[72px_minmax(0,1.8fr)_160px_140px_160px_140px_120px] gap-4 border-b border-border bg-soft/40 px-5 py-4 text-xs font-bold uppercase tracking-[.14em] text-muted">
            <span>#</span>
            <span>Decision</span>
            <span>Score</span>
            <span>Users</span>
            <span>Rating</span>
            <span>Trend</span>
            <span>CTA</span>
          </div>
          <div className="divide-y divide-border">
            {filtered.map((row) => <RankingRow key={row.decision.id} row={row} />)}
          </div>
        </div>

        <div className="grid gap-4 lg:hidden">
          {filtered.map((row) => <RankingCard key={row.decision.id} row={row} />)}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader eyebrow="Top 3" title="Top 3 badges" description="The top-ranked decisions are highlighted clearly for quick scanning." />
        <div className="grid gap-4 md:grid-cols-3">
          {topThree.map((row, index) => (
            <TopRankCard key={row.decision.id} row={row} position={index + 1} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader eyebrow="Category cards" title="Category leaders" description="Browse the strongest decisions per category." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => {
            const best = filtered.find((item) => categoryMatches(item.decision.category, category.id));
            return (
              <CategoryRankingCard
                key={category.id}
                label={category.label}
                description={category.description}
                score={best?.score ?? 0}
                users={best?.users ?? 0}
                href={getDecisionRoute(best?.decision.slug) ?? `/category/${category.id}`}
                decision={best?.decision}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}

function RankingRow({ row }: { row: RankedDecision }) {
  const href = getDecisionRoute(row.decision.slug);
  return (
    <div className="grid grid-cols-[72px_minmax(0,1.8fr)_160px_140px_160px_140px_120px] items-center gap-4 px-5 py-4">
      <div className="flex items-center gap-2">
        {rankBadge(row.rank)}
        <span className="text-sm font-bold text-ink">{row.rank}</span>
      </div>
      <DecisionMeta decision={row.decision} users={row.users} rating={row.rating} />
      <div>
        <p className="text-sm font-semibold text-ink">{row.score}/100</p>
        <div className="mt-2"><ScoreBar value={row.score} /></div>
      </div>
      <div>
        <p className="text-sm font-semibold text-ink">{row.users.toLocaleString("en-IN")}</p>
        <p className="text-xs text-muted">users explored</p>
      </div>
      <div>
        <p className="text-sm font-semibold text-ink">{row.rating.toFixed(1)} / 5</p>
        <p className="text-xs text-muted">rating</p>
      </div>
      <div className="h-16">
        <MiniLineChart points={row.trendSeries} />
      </div>
      <div>
        {href ? (
          <Link href={href} className="inline-flex">
            <Button variant="secondary">Open <ArrowRight size={16} /></Button>
          </Link>
        ) : (
          <Button variant="secondary" disabled>Coming soon</Button>
        )}
      </div>
    </div>
  );
}

function RankingCard({ row }: { row: RankedDecision }) {
  const href = getDecisionRoute(row.decision.slug);
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {rankBadge(row.rank)}
          <span className="text-sm font-bold">{row.rank}</span>
        </div>
        <Badge>{row.decision.category}</Badge>
      </div>
      <DecisionMeta decision={row.decision} users={row.users} rating={row.rating} />
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Score</p>
        <ScoreBar value={row.score} />
      </div>
      <div className="rounded-2xl border border-border bg-soft/30 p-4">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Trend</p>
        <div className="mt-3"><MiniLineChart points={row.trendSeries} /></div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[.14em] text-muted">{row.decision.shortTitle}</span>
        {href ? <Link href={href} className="inline-flex"><Button variant="secondary">Open <ArrowRight size={16} /></Button></Link> : <Button variant="secondary" disabled>Coming soon</Button>}
      </div>
    </Card>
  );
}

function TopRankCard({ row, position }: { row: RankedDecision; position: 1 | 2 | 3 | number }) {
  const tone = position === 1 ? "gold" : position === 2 ? "silver" : "bronze";
  const href = getDecisionRoute(row.decision.slug);
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <Badge className={topBadgeClass(tone)}>Top {position}</Badge>
        <Badge>{row.decision.category}</Badge>
      </div>
      <DecisionMeta decision={row.decision} users={row.users} rating={row.rating} />
      <ProgressRing value={row.score} size={112} tone={position === 1 ? "accent" : position === 2 ? "primary" : "success"} />
      <div className="h-16"><MiniLineChart points={row.trendSeries} /></div>
      {href ? <Link href={href} className="inline-flex"><Button variant="secondary">Open <ArrowRight size={16} /></Button></Link> : <Button variant="secondary" disabled>Coming soon</Button>}
    </Card>
  );
}

function CategoryRankingCard({ label, description, score, users, href, decision }: { label: string; description: string; score: number; users: number; href: string; decision?: DiscoveryDecision; }) {
  return (
    <Link href={href} className="block h-full">
      <Card className="flex h-full flex-col gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
        <div className="flex items-start justify-between gap-3">
          <Badge>{label}</Badge>
          <span className="text-xs font-semibold text-muted">{users ? `${users.toLocaleString("en-IN")} users` : "Active category"}</span>
        </div>
        <div>
          <h3 className="text-lg font-bold">{label}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Score</p>
          <ScoreBar value={score} />
        </div>
        {decision ? (
          <div className="rounded-2xl border border-border bg-soft/30 p-4">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Leading decision</p>
            <p className="mt-2 text-sm font-semibold text-ink">{decision.title}</p>
          </div>
        ) : null}
        <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-primary">
          Open category <ArrowRight size={16} />
        </span>
      </Card>
    </Link>
  );
}

function DecisionMeta({ decision, users, rating }: { decision: DiscoveryDecision; users: number; rating: number }) {
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{decision.category}</Badge>
        <Badge className="border-border bg-soft text-muted">{decision.shortTitle}</Badge>
      </div>
      <h3 className="text-lg font-bold tracking-tight">{decision.title}</h3>
      <p className="text-sm leading-6 text-muted">{decision.description}</p>
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
        <span className="inline-flex items-center gap-1"><Users size={14} /> {users.toLocaleString("en-IN")} users</span>
        <span className="inline-flex items-center gap-1"><Star size={14} /> {rating.toFixed(1)}</span>
        <span className="inline-flex items-center gap-1"><Clock3 size={14} /> {decision.estimatedTime}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {decision.tags.slice(0, 3).map((tag) => <Badge key={tag} className="border-border bg-soft text-muted">{tag}</Badge>)}
      </div>
    </div>
  );
}

function ScoreBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-soft">
      <div className="h-full rounded-full bg-gradient-to-r from-primary via-blue-600 to-accent transition-[width] duration-500" style={{ width: `${Math.max(5, Math.min(100, value))}%` }} />
    </div>
  );
}

function KpiCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-muted">{label}</p>
        <span className="text-primary">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </Card>
  );
}

function FilterPill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition ${selected ? "border-primary bg-primary/10 text-primary" : "border-border bg-white text-muted hover:border-primary/20 hover:text-ink"}`}
    >
      {label}
    </button>
  );
}

function categoryMatches(category: string, slugOrLabel: string) {
  return category.toLowerCase().replace(/\s+/g, "-") === slugOrLabel || category.toLowerCase() === slugOrLabel.toLowerCase();
}

function sortDecisions(decisions: DiscoveryDecision[], sort: SortTab) {
  const list = [...decisions];
  switch (sort) {
    case "top-rated":
      return list.sort((a, b) => deriveRating(b) - deriveRating(a) || b.popularityScore - a.popularityScore);
    case "score":
      return list.sort((a, b) => deriveScore(b) - deriveScore(a) || b.popularityScore - a.popularityScore);
    case "trending":
      return list.sort((a, b) => b.trendingScore - a.trendingScore || b.popularityScore - a.popularityScore);
    default:
      return list.sort((a, b) => b.popularityScore - a.popularityScore || b.trendingScore - a.trendingScore);
  }
}

function deriveScore(decision: DiscoveryDecision) {
  return decision.popularityScore;
}

function deriveRating(decision: DiscoveryDecision) {
  return Math.round((Math.min(100, Math.max(40, decision.popularityScore)) / 20) * 10) / 10;
}

function deriveUsers(decision: DiscoveryDecision, time: TimeFilter) {
  const base = decision.popularityScore * 18;
  const multiplier = time === "7d" ? 0.42 : time === "30d" ? 1 : 2.2;
  return Math.max(120, Math.round(base * multiplier));
}

function buildTrendSeries(decision: DiscoveryDecision, time: TimeFilter) {
  const base = time === "7d" ? 4 : time === "30d" ? 6 : 8;
  return Array.from({ length: base }, (_, index) => {
    const delta = Math.sin(index * 0.8 + decision.trendingScore / 30) * 10 + (decision.trendingScore / 10) + index * (time === "90d" ? 2 : 1);
    return Math.max(12, Math.round(delta));
  });
}

function rankBadge(position: number) {
  if (position === 1) return <Badge className="border-amber-500/15 bg-amber-500/10 text-amber-700">#1</Badge>;
  if (position === 2) return <Badge className="border-slate-300 bg-slate-100 text-slate-700">#2</Badge>;
  if (position === 3) return <Badge className="border-orange-500/15 bg-orange-500/10 text-orange-700">#3</Badge>;
  return <Badge className="border-border bg-soft text-muted">#{position}</Badge>;
}

function topBadgeClass(tone: "gold" | "silver" | "bronze") {
  return {
    gold: "border-amber-500/15 bg-amber-500/10 text-amber-700",
    silver: "border-slate-300 bg-slate-100 text-slate-700",
    bronze: "border-orange-500/15 bg-orange-500/10 text-orange-700",
  }[tone];
}

type RankedDecision = {
  decision: DiscoveryDecision;
  rank: number;
  score: number;
  rating: number;
  users: number;
  trendSeries: number[];
};

const sortTabs: Array<{ id: SortTab; label: string }> = [
  { id: "popular", label: "Most Popular" },
  { id: "top-rated", label: "Top Rated" },
  { id: "score", label: "Highest Score" },
  { id: "trending", label: "Trending" },
];

const timeFilters: Array<{ id: TimeFilter; label: string }> = [
  { id: "all", label: "All time" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
];
