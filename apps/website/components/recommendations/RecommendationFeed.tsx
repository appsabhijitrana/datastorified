"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, Sparkles } from "lucide-react";
import { authClient } from "@datastorified/auth";
import { trackDiscoveryEvent } from "@datastorified/analytics";
import {
  getDecisionRoute,
  getLiveDecisions,
  getPopularDecisions,
  getRelatedDecisions,
  getTrendingDecisions,
  getQuickDecisions,
  type DiscoveryDecision,
  type DecisionMemoryDraft,
  type StoredDecision,
} from "@datastorified/decision-os";
import { getDecisionAdapters } from "@datastorified/decision-os/adapters";
import { Badge, Button, Card, ProgressBar, ScoreRing, SectionHeader } from "@datastorified/ui/design-system";
import { getProfileAnalysis } from "@datastorified/profile";
import { buildPersonalizedRecommendations, type PersonalizationContext as RecommendationContext } from "@datastorified/personalization";
import { storage } from "@datastorified/storage";
import type { DecisionProfileEnvelope } from "@datastorified/profile";

type RecommendationItem = {
  decision: DiscoveryDecision;
  reason: string;
  source: "drafts" | "related" | "profile" | "trending" | "quick" | "reminder";
  sourceLabel: string;
};

export function PersonalizedRecommendationFeed({ drafts = [], recentDecisions = [], onProfileNudge }: { drafts?: DecisionMemoryDraft[]; recentDecisions?: StoredDecision[]; onProfileNudge: () => void; }) {
  const { data: session } = authClient.useSession();
  const adapters = getDecisionAdapters();
  const [profileScore, setProfileScore] = useState(0);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [profileMessage, setProfileMessage] = useState("Complete your profile to improve suggestions.");
  const [feed, setFeed] = useState<RecommendationItem[]>([]);

  useEffect(() => {
    let mounted = true;
    void adapters.profile.getProfile().then((profileEnvelope) => {
      if (!mounted) return;
      const analysis = getProfileAnalysis((profileEnvelope as DecisionProfileEnvelope | null)?.profile);
      setProfileScore(analysis.score);
      setProfileCompletion(analysis.percentage);
      setProfileMessage(analysis.nextBestField?.label ? `Complete your profile to improve suggestions. Next: ${analysis.nextBestField.label}` : "Complete your profile to improve suggestions.");
    });
    return () => {
      mounted = false;
    };
  }, [adapters.profile]);

  useEffect(() => {
    let mounted = true;
    void Promise.all([
      adapters.profile.getProfile(),
      adapters.memory.listRecent(),
      adapters.memory.listSaved(),
      adapters.memory.listHistory(),
    ]).then(([profileEnvelope, recent, saved, history]) => {
      if (!mounted) return;
      const profile = (profileEnvelope as DecisionProfileEnvelope | null)?.profile;
      const context: RecommendationContext = {
        profile,
        recentDecisions: recent,
        savedDecisions: saved,
        history,
        favoriteWorkflowIds: saved.map((decision) => decision.workflowId),
        recentCalculators: storage.getRecent("calculators"),
        favoriteCalculators: storage.getFavorites("calculators"),
      };
      const recommendations = buildPersonalizedRecommendations(context);
      const personalFeed = recommendations.workflowRecommendations.map((item) => ({
        decision: workflowToDecision(item.workflow.slug),
        reason: item.reason,
        source: "profile" as const,
        sourceLabel: "Profile",
      }));
      setFeed(buildFeed({ drafts, recentDecisions, profileCompletion, recommendationFeed: personalFeed }));
    });
    return () => {
      mounted = false;
    };
  }, [adapters.memory, adapters.profile, drafts, profileCompletion, recentDecisions]);

  const topWorkflows = useMemo(() => feed.slice(0, 4), [feed]);

  return (
    <section className="space-y-6">
      <Card className="border-primary/15 bg-gradient-to-br from-primary/[.05] to-accent/[.08] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge className="inline-flex"><Sparkles size={13} className="mr-1" /> Personalized for you</Badge>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">Recommended next moves</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              We rank these with profile completeness, recent decision history, saved items, category patterns, reminders, and quick options.
            </p>
          </div>
          {session?.user ? <ScoreRing score={profileScore} /> : <div className="rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-muted">Trending + quick fallback</div>}
        </div>
        {session?.user && <div className="mt-5"><ProgressBar value={profileCompletion} label="Profile completeness" /></div>}
      </Card>

      <DiscoveryFeedSection eyebrow="Drafts" title="Continue decisions">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {drafts.slice(0, 2).map((draft) => {
            const decision = workflowToDecision(draft.workflowId);
            const href = getDecisionRoute(decision.slug);
            return href ? <ContinueDecisionCard key={draft.workflowId + draft.updatedAt} title={decision.title} subtitle="Draft saved on this device" href={href} badge="Continue where you left" /> : null;
          })}
        </div>
      </DiscoveryFeedSection>

      <DiscoveryFeedSection eyebrow="Suggested" title="Decision rails">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {topWorkflows.map((item) => (
            <Card key={`${item.source}-${item.decision.id}`} className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <RecommendationSourceLabel label={item.sourceLabel} />
                <RecommendationReasonBadge reason={item.reason} />
              </div>
              <h3 className="mt-3 text-lg font-bold">{item.decision.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{item.decision.description}</p>
              <div className="mt-4 flex items-center gap-3 text-sm text-muted">
                <span className="inline-flex items-center gap-1"><Clock3 size={14} /> {item.decision.estimatedTime}</span>
                <span>{item.decision.factorCount} factors</span>
              </div>
              <div className="mt-auto pt-5">
                {getDecisionRoute(item.decision.slug) ? (
                  <Link
                    href={getDecisionRoute(item.decision.slug)!}
                    onClick={() => {
                      trackDiscoveryEvent("recommendation_clicked", {
                        decision_slug: item.decision.slug,
                        category: item.decision.category,
                        source_section: "recommendation_feed",
                        is_logged_in: Boolean(session?.user),
                        device_type: typeof window === "undefined" ? "unknown" : window.innerWidth < 768 ? "mobile" : "desktop",
                      });
                      trackDiscoveryEvent("decision_started", {
                        decision_slug: item.decision.slug,
                        category: item.decision.category,
                        source_section: "recommendation_feed",
                        is_logged_in: Boolean(session?.user),
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
          ))}
        </div>
      </DiscoveryFeedSection>

      <ImproveRecommendationNudge
        title="Complete your profile to improve suggestions"
        description={session?.user ? profileMessage : "Anonymous users can still explore trending decisions."}
        actionLabel="Improve accuracy"
        onAction={onProfileNudge}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {getQuickDecisions().slice(0, 3).map((decision) => (
          <RecommendationCard
            key={decision.id}
            decision={decision}
            reason="Quick decision under 2 minutes"
            sourceLabel="Quick"
            onClickSource="quick"
            isLoggedIn={Boolean(session?.user)}
          />
        ))}
        {getTrendingDecisions().slice(0, 3).map((decision) => (
          <RecommendationCard
            key={decision.id}
            decision={decision}
            reason="Popular this week"
            sourceLabel="Trending"
            onClickSource="trending"
            isLoggedIn={Boolean(session?.user)}
          />
        ))}
      </div>
    </section>
  );
}

export function RecommendedDecisionRail(props: { drafts?: DecisionMemoryDraft[]; recentDecisions?: StoredDecision[]; onProfileNudge: () => void }) {
  return <PersonalizedRecommendationFeed {...props} />;
}

export function RecommendationReasonBadge({ reason }: { reason: string }) {
  return <span className="inline-flex min-h-8 items-center rounded-full border border-primary/10 bg-primary/5 px-3 text-xs font-semibold text-primary">{reason}</span>;
}

export function RecommendationSourceLabel({ label }: { label: string }) {
  return <span className="inline-flex min-h-8 items-center rounded-full border border-border bg-soft px-3 text-xs font-semibold text-muted">{label}</span>;
}

export function ImproveRecommendationNudge({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel: string; onAction: () => void }) {
  return (
    <Card className="border-primary/15 bg-gradient-to-br from-primary/[.05] to-accent/[.08] p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-primary shadow-sm"><Sparkles size={18} /></span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
          <Button className="mt-4" variant="secondary" onClick={onAction}>{actionLabel}</Button>
        </div>
      </div>
    </Card>
  );
}

export function ContinueDecisionCard({ title, subtitle, href, badge }: { title: string; subtitle: string; href: string; badge: string }) {
  return (
    <Link href={href} className="block h-full">
      <Card className="flex h-full flex-col p-5 transition hover:-translate-y-1 hover:shadow-lift">
        <RecommendationReasonBadge reason={badge} />
        <h3 className="mt-3 text-lg font-bold">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p>
        <p className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-primary">Continue <ArrowRight size={16} /></p>
      </Card>
    </Link>
  );
}

export function DiscoveryFeedSection({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <SectionHeader eyebrow={eyebrow} title={title} />
      {children}
    </section>
  );
}

function RecommendationCard({
  decision,
  reason,
  sourceLabel,
  onClickSource,
  isLoggedIn,
}: {
  decision: DiscoveryDecision;
  reason: string;
  sourceLabel: string;
  onClickSource: "quick" | "trending";
  isLoggedIn: boolean;
}) {
  const href = getDecisionRoute(decision.slug);
  return (
    <Card className="flex h-full flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <RecommendationSourceLabel label={sourceLabel} />
        <RecommendationReasonBadge reason={reason} />
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
              trackDiscoveryEvent("recommendation_clicked", {
                decision_slug: decision.slug,
                category: decision.category,
                source_section: onClickSource,
                is_logged_in: isLoggedIn,
                device_type: typeof window === "undefined" ? "unknown" : window.innerWidth < 768 ? "mobile" : "desktop",
              });
              trackDiscoveryEvent("decision_started", {
                decision_slug: decision.slug,
                category: decision.category,
                source_section: onClickSource,
                is_logged_in: isLoggedIn,
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

function buildFeed({
  drafts,
  recentDecisions,
  profileCompletion,
  recommendationFeed,
}: {
  drafts: DecisionMemoryDraft[];
  recentDecisions: StoredDecision[];
  profileCompletion: number;
  recommendationFeed: RecommendationItem[];
}): RecommendationItem[] {
  const draftsFeed = drafts.map((draft) => ({ decision: workflowToDecision(draft.workflowId), reason: "Because you started this already", source: "drafts" as const, sourceLabel: "Draft" }));
  const relatedCategories = recentDecisions.flatMap((decision) => {
    const workflow = workflowToDecision(decision.workflowId);
    const categoryLabel = workflow.category ?? "this";
    const relatedSlug = workflow.slug ?? workflow.id;
    return getRelatedDecisions(relatedSlug).slice(0, 1).map((related) => ({
      decision: related,
      reason: `Related to your saved ${categoryLabel.toLowerCase()} decision`,
      source: "related" as const,
      sourceLabel: "Related",
    }));
  });
  const profileFeed = recommendationFeed.length ? recommendationFeed : getPopularDecisions().slice(0, 2).map((decision) => ({ decision, reason: profileCompletion > 0 ? "Because you explored Money decisions" : "Popular this week", source: "profile" as const, sourceLabel: "Profile" }));
  const trendingFeed = getTrendingDecisions().slice(0, 3).map((decision) => ({ decision, reason: "Popular this week", source: "trending" as const, sourceLabel: "Trending" }));
  const quickFeed = getQuickDecisions().slice(0, 3).map((decision) => ({ decision, reason: "Quick decision under 2 minutes", source: "quick" as const, sourceLabel: "Quick" }));

  return [...draftsFeed, ...relatedCategories, ...profileFeed, ...trendingFeed, ...quickFeed]
    .filter((item, index, items) => items.findIndex((candidate) => candidate.decision.id === item.decision.id) === index)
    .slice(0, 6);
}

function workflowToDecision(slugOrId: string): DiscoveryDecision {
  const decision = getLiveDecisions().find((item) => item.slug === slugOrId || item.id === slugOrId) ?? getPopularDecisions()[0] ?? getTrendingDecisions()[0];
  return decision ?? getLiveDecisions()[0];
}
