"use client";

import Link from "next/link";
import { ArrowRight, Clock3, Sparkles } from "lucide-react";
import { authClient } from "@datastorified/auth";
import { trackDiscoveryEvent } from "@datastorified/analytics";
import {
  getDecisionBySlug,
  getDecisionRoute,
  getLiveDecisions,
  getPopularDecisions,
  getQuickDecisions,
  getRelatedDecisions,
  getTrendingDecisions,
  type DiscoveryDecision,
} from "@datastorified/decision-os";
import { Badge, Button, Card, SectionHeader } from "@datastorified/ui/design-system";

export function RelatedDecisionJourney({ slug }: { slug: string }) {
  const { data: session } = authClient.useSession();
  const deviceType = typeof window === "undefined" ? "unknown" : window.innerWidth < 768 ? "mobile" : "desktop";
  const current = getDecisionBySlug(slug);
  const related = getRelatedDecisions(slug).slice(0, 4);
  const comparisons = pickPeopleAlsoCompare(current, slug);
  const quick = getQuickNext(slug);
  const trending = getTrendingDecisions().filter((decision) => decision.slug !== slug).slice(0, 4);

  return (
    <section className="space-y-5">
      <div className="rounded-[1.75rem] border border-primary/15 bg-gradient-to-br from-primary/[.05] to-accent/[.07] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-primary shadow-sm">
            <Sparkles size={18} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Next step</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Want to make another smart decision?</h2>
            <p className="mt-2 text-sm leading-6 text-muted">A few related options can help you compare the next best move without starting from scratch.</p>
          </div>
        </div>
      </div>

      <RelatedDecisionCard title="Related to this decision" eyebrow="Related" items={related.length ? related : fallbackByCategory(current?.category, slug)} isLoggedIn={Boolean(session?.user)} deviceType={deviceType} />
      <RelatedDecisionCard title="People also compare" eyebrow="Compare" items={comparisons} />
      <QuickNextDecisionRail title="Quick 2-minute decisions" eyebrow="Quick" items={quick} />
      <RelatedDecisionCard title="Trending now" eyebrow="Trending" items={trending} />
    </section>
  );
}

export const DecisionRetentionLoop = RelatedDecisionJourney;

export function RelatedDecisionCard({ title, eyebrow, items, isLoggedIn, deviceType }: { title: string; eyebrow: string; items: DiscoveryDecision[]; isLoggedIn?: boolean; deviceType?: string }) {
  if (!items.length) return null;
  return (
    <section className="space-y-4">
      <SectionHeader eyebrow={eyebrow} title={title} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((decision) => {
          const href = getDecisionRoute(decision.slug);
          return (
            <Card key={decision.id} className="flex min-w-0 flex-1 flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <Badge>{decision.category}</Badge>
                <ReasonBadge decision={decision} />
              </div>
              <div>
                <h3 className="text-lg font-bold">{decision.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{decision.description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                <span className="inline-flex items-center gap-1"><Clock3 size={14} /> {decision.estimatedTime}</span>
                <span>{decision.factorCount} factors</span>
              </div>
              <div className="mt-auto">
                {href ? (
                  <Link
                    href={href}
                    onClick={() => {
                      trackDiscoveryEvent("related_decision_clicked", {
                        decision_slug: decision.slug,
                        category: decision.category,
                        source_section: title,
                        is_logged_in: Boolean(isLoggedIn),
                        device_type: deviceType ?? "unknown",
                      });
                      trackDiscoveryEvent("decision_started", {
                        decision_slug: decision.slug,
                        category: decision.category,
                        source_section: title,
                        is_logged_in: Boolean(isLoggedIn),
                        device_type: deviceType ?? "unknown",
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
        })}
      </div>
    </section>
  );
}

export function QuickNextDecisionRail({ title, eyebrow, items, isLoggedIn, deviceType }: { title: string; eyebrow: string; items: DiscoveryDecision[]; isLoggedIn?: boolean; deviceType?: string }) {
  return <RelatedDecisionCard title={title} eyebrow={eyebrow} items={items} isLoggedIn={isLoggedIn} deviceType={deviceType} />;
}

export function ReasonBadge({ decision }: { decision: DiscoveryDecision }) {
  if (decision.isQuickDecision) return <Badge className="border-border bg-soft text-muted">Quick next</Badge>;
  if (decision.isTrending) return <Badge className="border-emerald-500/15 bg-emerald-500/10 text-emerald-700">Trending</Badge>;
  if (decision.isPopular) return <Badge className="border-primary/15 bg-primary/5 text-primary">Popular</Badge>;
  return <Badge className="border-border bg-soft text-muted">Related</Badge>;
}

function fallbackByCategory(category: string | undefined, currentSlug: string): DiscoveryDecision[] {
  const base = getLiveDecisions().filter((decision) => decision.slug !== currentSlug && (!category || decision.category === category));
  return base.slice(0, 4);
}

function pickPeopleAlsoCompare(current: DiscoveryDecision | undefined, slug: string): DiscoveryDecision[] {
  const popular = getPopularDecisions().filter((decision) => decision.slug !== slug);
  if (!current) return popular.slice(0, 4);
  const sameCategory = popular.filter((decision) => decision.category === current.category);
  if (sameCategory.length) return sameCategory.slice(0, 4);
  return popular.slice(0, 4);
}

function getQuickNext(slug: string): DiscoveryDecision[] {
  return getQuickDecisions().filter((decision) => decision.slug !== slug).slice(0, 4);
}
