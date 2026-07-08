"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient, GoogleSignInButton } from "@datastorified/auth";
import { trackDiscoveryEvent } from "@datastorified/analytics";
import { Badge, Button, Card, Chip, EmptyState, PageHeader, ProgressBar, ScoreRing, SectionHeader, StatusBadge } from "@datastorified/ui/design-system";
import { decisionPluginRegistry, getDecisionRoute, getLiveDecisions, getPopularDecisions, type DecisionMemoryDraft, type StoredDecision } from "@datastorified/decision-os";
import { DecisionOrchestrator } from "@datastorified/decision-os/core/orchestrator";
import { getDecisionAdapters } from "@datastorified/decision-os/adapters";
import { getProfileAnalysis } from "@datastorified/profile";
import { DecisionSearch } from "../decision/DecisionSearch";
import { DecisionAccuracyBadge } from "../decision/DecisionAccuracyBadge";
import { HybridDecisionRepository } from "@datastorified/decision-repository";
import { decisionRouteFromText } from "../../lib/decision-routing";
import { RecommendedDecisionRail } from "../recommendations/RecommendationFeed";
import { ProgressiveProfileNudge } from "../profile/ProgressiveProfileNudge";

const quickChips = [
  "FD vs SIP",
  "Rent vs Buy",
  "EV vs Petrol",
  "Job Switch",
  "Phone Comparison",
  "Emergency Fund",
];

export function DecisionHubHome() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const repository = useMemo(() => new HybridDecisionRepository({ authenticated: Boolean(session?.user) }), [session?.user]);
  const orchestrator = useMemo(() => new DecisionOrchestrator({ repository }), [repository]);
  const adapters = getDecisionAdapters();
  const liveDecisions = useMemo(() => getLiveDecisions(), []);
  const [drafts, setDrafts] = useState<DecisionMemoryDraft[]>([]);
  const [recent, setRecent] = useState<StoredDecision[]>([]);
  const [profileScore, setProfileScore] = useState(0);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [nextField, setNextField] = useState<string | null>(null);
  const [loadingMemory, setLoadingMemory] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingMemory(true);
    void Promise.all([orchestrator.listDrafts(), orchestrator.listRecentDecisions(), adapters.profile.getProfile()])
      .then(([draftItems, recentItems, profileEnvelope]) => {
        if (cancelled) return;
        setDrafts(draftItems.slice(0, 3));
        setRecent(recentItems.slice(0, 3));
        const analysis = getProfileAnalysis(profileEnvelope?.profile);
        setProfileScore(analysis.score);
        setProfileCompletion(analysis.percentage);
        setNextField(analysis.nextBestField?.label ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoadingMemory(false);
      });
    return () => { cancelled = true; };
  }, [adapters.profile, orchestrator]);

  const continueItems = drafts.length ? drafts : recent;
  const clarityScore = Math.max(0, Math.min(100, profileScore));

  return (
    <div className="space-y-8 pb-6">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Decision Engine</Badge>
          {session?.user ? <DecisionAccuracyBadge analysis={{ label: "Decision Confidence", level: profileCompletion >= 70 ? "advanced" : "better", percentage: profileCompletion }} /> : <StatusBadge status="neutral" />}
        </div>
        <PageHeader
          title="What decision are you trying to make today?"
          description="Search a decision, pick a quick chip, or jump back into something you already started."
        />
        <DecisionSearch large placeholder="Search any decision…" ariaLabel="Search any decision…" sourceSection="home_search" />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {quickChips.map((chip) => (
            <Chip key={chip} className="whitespace-nowrap" onClick={() => {
              const route = decisionRouteFromText(chip);
              trackDiscoveryEvent("decision_card_clicked", {
                source_section: "home_quick_chip",
                is_logged_in: Boolean(session?.user),
                device_type: typeof window === "undefined" ? "unknown" : window.innerWidth < 768 ? "mobile" : "desktop",
              });
              if (route) router.push(route);
            }}>{chip}</Chip>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader eyebrow="Continue where you left" title="Continue where you left" description="Drafts and recent decisions stay available locally, and signed-in users can sync them to their account." />
        {loadingMemory ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((index) => <Card key={index} className="h-32 animate-pulse bg-soft" />)}
          </div>
        ) : continueItems.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {drafts.map((draft) => {
              const workflow = decisionPluginRegistry.getWorkflow(draft.workflowId);
              return <MemoryCard key={draft.workflowId + draft.updatedAt} title={workflow?.title ?? draft.workflowId} subtitle="Draft saved on this device" href={`/decision/${draft.pluginId}/${workflow?.slug ?? draft.workflowId}`} />;
            })}
            {recent.map((item) => {
              const workflow = decisionPluginRegistry.getWorkflow(item.workflowId);
              return <MemoryCard key={item.id} title={workflow?.title ?? item.workflowId} subtitle="Recent decision" href={`/decision/result/${item.id}`} />;
            })}
          </div>
        ) : (
          <Card className="p-6">
            <EmptyState title="Start your first decision. It takes less than 3 minutes." description="Your drafts and results will appear here once you start a flow." />
          </Card>
        )}
      </section>

      <RecommendedDecisionRail drafts={drafts} recentDecisions={recent} onProfileNudge={() => router.push("/profile")} />

      <section className="space-y-4">
        <SectionHeader eyebrow="Popular decisions" title="Popular decisions" description="Fast, high-intent decisions people open most often." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {getPopularDecisions().slice(0, 6).map((decision) => {
            const route = getDecisionRoute(decision.slug);
            if (!route) return null;
            return (
            <Card key={decision.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <Badge>{decision.category}</Badge>
                  <span className="text-xs font-semibold text-muted">{decision.factorCount} factors</span>
                </div>
                <h3 className="mt-3 text-lg font-bold">{decision.title}</h3>
                <div className="mt-3 flex items-center gap-4 text-sm text-muted">
                  <span className="inline-flex items-center gap-1"><Clock3 size={14} /> {decision.estimatedTime}</span>
                  <span>{decision.factorCount} factor checks</span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-muted">Category: {decision.category}</span>
                  <Link
                    href={route}
                    onClick={() => {
                      trackDiscoveryEvent("decision_card_clicked", {
                        decision_slug: decision.slug,
                        category: decision.category,
                        source_section: "home_popular",
                        is_logged_in: Boolean(session?.user),
                        device_type: typeof window === "undefined" ? "unknown" : window.innerWidth < 768 ? "mobile" : "desktop",
                      });
                      trackDiscoveryEvent("decision_started", {
                        decision_slug: decision.slug,
                        category: decision.category,
                        source_section: "home_popular",
                        is_logged_in: Boolean(session?.user),
                        device_type: typeof window === "undefined" ? "unknown" : window.innerWidth < 768 ? "mobile" : "desktop",
                      });
                    }}
                  >
                    <Button variant="secondary">Start <ArrowRight size={16} /></Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader eyebrow="Trending in India" title="Trending in India" description="Quick signals from the current decision mix." />
        <div className="flex gap-4 overflow-x-auto pb-1">
          {liveDecisions.filter((decision) => decision.isTrending).slice(0, 3).map((decision) => (
            <Card key={decision.id} className="min-w-64 flex-1 p-5">
              <Badge>{decision.shortTitle}</Badge>
              <p className="mt-3 text-sm leading-6 text-muted">{decision.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Decision Confidence</p>
              <h2 className="mt-2 text-xl font-bold">Suitability Score and confidence signals</h2>
            </div>
            {session?.user ? <ScoreRing score={clarityScore} /> : <StatusBadge status="neutral" />}
          </div>
          {!session?.user ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm leading-6 text-muted">Sign in with Google to save decisions and improve future analysis.</p>
              <GoogleSignInButton className="w-full sm:w-auto">Sign in with Google</GoogleSignInButton>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Stat label="Decision Clarity Score" value={`${Math.round(clarityScore)} / 100`} />
              <Stat label="Completed decisions" value={`${recent.length}`} />
              <Stat label="Saved drafts" value={`${drafts.length}`} />
              <Stat label="Profile completeness" value={`${Math.round(profileCompletion)}%`} />
            </div>
          )}
          {session?.user && <div className="mt-5"><ProgressBar value={profileCompletion} label="Profile completeness" /></div>}
          {session?.user && (
            <Link href="/profile" className="mt-5 inline-flex">
              <Button variant="secondary">Improve accuracy <ArrowRight size={16} /></Button>
            </Link>
          )}
        </Card>

        <ProgressiveProfileNudge
          context="money"
          title="Add one detail to improve future decision confidence."
          description={nextField ? `Next best field: ${nextField}. We only need one detail to make future guidance more precise.` : "We only need one detail to make future guidance more precise."}
          onSkip={() => router.push("/decision")}
          onSaved={() => router.push("/profile")}
        />
      </section>
    </div>
  );
}

function MemoryCard({ title, subtitle, href }: { title: string; subtitle: string; href: string }) {
  return (
    <Link href={href} className="block">
      <Card className="p-5 transition hover:-translate-y-1 hover:shadow-lift">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">{subtitle}</p>
        <h3 className="mt-2 text-lg font-bold">{title}</h3>
        <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-muted">Open decision <ArrowRight size={15} /></p>
      </Card>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-soft/30 p-4">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-muted">{label}</p>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}
