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
  type DiscoveryDecision,
  type DecisionMemoryDraft,
  type StoredDecision,
} from "@datastorified/decision-os";
import { getDecisionAdapters } from "@datastorified/decision-os/adapters";
import { Button, Card, ProgressBar, ScoreRing, SectionHeader } from "@datastorified/ui/design-system";
import { getProfileAnalysis } from "@datastorified/profile";
import { createDataStorifiedClient } from "@datastorified/sdk";

type RecommendedDecision = {
  decision: DiscoveryDecision;
  reason: string;
  source: "drafts" | "related" | "profile" | "trending" | "quick";
};

export function WhyRecommendedBadge({ reason }: { reason: string }) {
  return <span className="inline-flex min-h-8 items-center rounded-full border border-primary/10 bg-primary/5 px-3 text-xs font-semibold text-primary">{reason}</span>;
}

export function PersonalizedNudge({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel: string; onAction: () => void }) {
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
        <WhyRecommendedBadge reason={badge} />
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

export function RecommendedDecisionRail({
  drafts = [],
  recentDecisions = [],
  onProfileNudge,
}: {
  drafts?: DecisionMemoryDraft[];
  recentDecisions?: StoredDecision[];
  onProfileNudge: () => void;
}) {
  const { data: session } = authClient.useSession();
  const adapters = getDecisionAdapters();
  const client = useMemo(() => createDataStorifiedClient(), []);
  const [profileScore, setProfileScore] = useState(0);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [profileMessage, setProfileMessage] = useState("Complete your profile to improve suggestions.");
  const [feed, setFeed] = useState<RecommendedDecision[]>([]);

  useEffect(() => {
    let mounted = true;
    void adapters.profile.getProfile().then((profileEnvelope) => {
      if (!mounted) return;
      const analysis = getProfileAnalysis(profileEnvelope?.profile);
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
    const context = session?.user
      ? {
          recentDecisions,
          savedDecisions: recentDecisions,
          favoriteWorkflowIds: recentDecisions.map((decision) => decision.workflowId),
        }
      : {};

    void client.recommendations.list(context).then((result) => {
      if (!mounted) return;
      const apiFeed = result.ok ? result.data.workflowRecommendations.map((item) => ({ decision: workflowToDecision(item.workflow.slug), reason: item.reason, source: "profile" as const })) : [];
      setFeed(buildFeed({ drafts, recentDecisions, profileCompletion, apiFeed }));
    });

    return () => {
      mounted = false;
    };
  }, [client.recommendations, drafts, recentDecisions, profileCompletion, session?.user]);

  return (
    <section className="space-y-6">
      <Card className="border-primary/15 bg-gradient-to-br from-primary/[.05] to-accent/[.08] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <WhyRecommendedBadge reason={session?.user ? "Cloud-aware suggestions" : "Anonymous suggestions"} />
            <h2 className="mt-3 text-2xl font-bold tracking-tight">Recommended for you</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              {session?.user ? profileMessage : "Anonymous users get trending and quick decisions first."}
            </p>
          </div>
          {session?.user ? <ScoreRing score={profileScore} /> : <div className="rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-muted">Trending + quick fallback</div>}
        </div>
        {session?.user && <div className="mt-5"><ProgressBar value={profileCompletion} label="Profile completeness" /></div>}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {drafts.slice(0, 2).map((draft) => {
          const decision = workflowToDecision(draft.workflowId);
          const href = getDecisionRoute(decision.slug);
          return href ? <ContinueDecisionCard key={draft.workflowId + draft.updatedAt} title={decision.title} subtitle="Draft saved on this device" href={href} badge="Continue where you left" /> : null;
        })}
      </div>

      <DiscoveryFeedSection eyebrow="Suggested" title="Decision rails">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {feed.map((item) => (
            <Card key={`${item.source}-${item.decision.id}`} className="flex h-full flex-col p-5">
              <WhyRecommendedBadge reason={item.reason} />
              <h3 className="mt-3 text-lg font-bold">{item.decision.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{item.decision.description}</p>
              <div className="mt-4 flex items-center gap-3 text-sm text-muted">
                <span className="inline-flex items-center gap-1"><Clock3 size={14} /> {item.decision.estimatedTime}</span>
                <span>{item.source === "quick" ? "Quick decision under 2 minutes" : item.source === "trending" ? "Popular with users comparing investments" : "Because you explored Money decisions"}</span>
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

      <PersonalizedNudge
        title="Complete your profile to improve suggestions"
        description={session?.user ? profileMessage : "Anonymous users can still explore trending decisions."}
        actionLabel="Improve accuracy"
        onAction={onProfileNudge}
      />
    </section>
  );
}

function buildFeed({
  drafts,
  recentDecisions,
  profileCompletion,
  apiFeed,
}: {
  drafts: DecisionMemoryDraft[];
  recentDecisions: StoredDecision[];
  profileCompletion: number;
  apiFeed: RecommendedDecision[];
}): RecommendedDecision[] {
  const draftsFeed = drafts.map((draft) => ({ decision: workflowToDecision(draft.workflowId), reason: "Because you started this already", source: "drafts" as const }));
  const relatedFeed = recentDecisions.flatMap((decision) => getRelatedDecisions(decision.workflowId).slice(0, 1).map((related) => ({ decision: related, reason: "Related to a completed decision", source: "related" as const })));
  const profileFeed = apiFeed.length ? apiFeed : getPopularDecisions().slice(0, 2).map((decision) => ({ decision, reason: profileCompletion > 0 ? "Because you explored Money decisions" : "Popular with users comparing investments", source: "profile" as const }));
  const trendingFeed = getTrendingDecisions().slice(0, 3).map((decision) => ({ decision, reason: "Popular with users comparing investments", source: "trending" as const }));
  const quickFeed = getLiveDecisions().filter((decision) => decision.isQuickDecision).slice(0, 3).map((decision) => ({ decision, reason: "Quick decision under 2 minutes", source: "quick" as const }));

  return [...draftsFeed, ...relatedFeed, ...profileFeed, ...trendingFeed, ...quickFeed]
    .filter((item, index, items) => items.findIndex((candidate) => candidate.decision.id === item.decision.id) === index)
    .slice(0, 6);
}

function workflowToDecision(slugOrId: string): DiscoveryDecision {
  const decision = getLiveDecisions().find((item) => item.slug === slugOrId || item.id === slugOrId) ?? getPopularDecisions()[0] ?? getTrendingDecisions()[0];
  return decision ?? getLiveDecisions()[0];
}
