"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BarChart3, Clock3, PieChart, Sparkles, TrendingUp } from "lucide-react";
import { authClient, GoogleSignInButton } from "@datastorified/auth";
import { trackDiscoveryEvent } from "@datastorified/analytics";
import { getDecisionCategories, getDecisionRoute, getLiveDecisions, getTrendingDecisions, type DecisionMemoryDraft, type StoredDecision } from "@datastorified/decision-os";
import { DecisionOrchestrator } from "@datastorified/decision-os/core/orchestrator";
import { getDecisionAdapters } from "@datastorified/decision-os/adapters";
import { HybridDecisionRepository } from "@datastorified/decision-repository";
import { getProfileAnalysis } from "@datastorified/profile";
import { localProfileStorage } from "@datastorified/profile";
import { decisionRouteFromText } from "../../lib/decision-routing";
import { RecommendedDecisionRail } from "../recommendations/RecommendationFeed";
import { ProgressiveProfileNudge } from "../profile/ProgressiveProfileNudge";
import { DecisionStreakCard, RetentionMilestones, ReturnPromptCard, WeeklyProgressCard, buildRetentionMilestones, buildRetentionSnapshot } from "../retention/RetentionHooks";
import { AIInsightCard, CategoryCard, ComparisonBar, ContinueDecisionCard, InsightCard, MetricCard, MiniLineChart, RecommendationCard, ScoreRing } from "@datastorified/ui/library";
import { Badge, Button, Card, Chip, EmptyState, PageHeader, SectionHeader } from "@datastorified/ui/design-system";

const quickChips = ["FD vs SIP", "Rent vs Buy", "EV vs Petrol", "Job vs Business", "iPhone vs Android", "More"];

export function DecisionHubHome() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const isLoggedIn = Boolean(session?.user);
  const repository = useMemo(() => new HybridDecisionRepository({ authenticated: Boolean(session?.user) }), [session?.user]);
  const orchestrator = useMemo(() => new DecisionOrchestrator({ repository }), [repository]);
  const adapters = getDecisionAdapters();
  const categories = useMemo(() => getDecisionCategories(), []);
  const trendingDecisions = useMemo(() => getTrendingDecisions(), []);
  const [drafts, setDrafts] = useState<DecisionMemoryDraft[]>([]);
  const [recent, setRecent] = useState<StoredDecision[]>([]);
  const [profileScore, setProfileScore] = useState(0);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [nextField, setNextField] = useState<string | null>(null);
  const [loadingMemory, setLoadingMemory] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingMemory(true);
    void Promise.all([
      orchestrator.listDrafts(),
      orchestrator.listRecentDecisions(),
      isLoggedIn ? adapters.profile.getProfile() : Promise.resolve(localProfileStorage.getProfile()),
    ])
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
    return () => {
      cancelled = true;
    };
  }, [adapters.profile, isLoggedIn, orchestrator]);

  const continueItems = drafts.length ? drafts : recent;
  const clarityScore = Math.max(0, Math.min(100, profileScore));
  const retentionSnapshot = buildRetentionSnapshot({
    completedThisWeek: recent.length,
    activeStreakDays: Math.min(14, recent.length * 2),
    categoriesExplored: new Set(recent.map((item) => getLiveDecisions().find((decision) => decision.id === item.workflowId)?.category ?? "General")).size,
    profileImprovements: Math.max(0, Math.round(profileCompletion / 20)),
    reviewedDecisions: recent.length,
  });
  const milestones = buildRetentionMilestones(retentionSnapshot);
  const kpis = [
    { title: "Decision Clarity Score", value: `${Math.round(clarityScore)}%`, detail: "Rounded preview of confidence signals.", icon: <Sparkles size={18} /> },
    { title: "Decisions Made", value: `${recent.length}`, detail: "Completed decision reports.", icon: <BarChart3 size={18} /> },
    { title: "Time Saved", value: `${Math.max(3, recent.length * 4)}h`, detail: "Estimated time saved by guided decisions.", icon: <Clock3 size={18} /> },
    { title: "Confidence Gained", value: `${Math.max(5, Math.round(profileCompletion / 2))}%`, detail: "Profile and history driven.", icon: <TrendingUp size={18} /> },
    { title: "Money Insight", value: "Strong", detail: "Current money decisions show the most activity.", icon: <PieChart size={18} /> },
  ];

  return (
    <div className="space-y-8 pb-6">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
        <div className="space-y-8">
          <section className="space-y-4">
            <PageHeader
              title="What decision are you trying to make today?"
              description="Search a decision, pick a quick chip, or jump back into something you already started."
            />
            <div className="flex flex-wrap gap-2">
              {quickChips.map((chip) => (
                <Chip
                  key={chip}
                  selected={chip === "More"}
                  onClick={() => {
                    if (chip === "More") {
                      router.push("/explore");
                      return;
                    }
                    const route = decisionRouteFromText(chip);
                    trackDiscoveryEvent("decision_card_clicked", {
                      source_section: "home_quick_chip",
                      is_logged_in: Boolean(session?.user),
                      device_type: typeof window === "undefined" ? "unknown" : window.innerWidth < 768 ? "mobile" : "desktop",
                    });
                    if (route) router.push(route);
                  }}
                >
                  {chip}
                </Chip>
              ))}
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-gradient-to-br from-white via-white to-primary/[.04] p-5 shadow-soft sm:p-6">
            <div className="absolute inset-0 opacity-60 [background:radial-gradient(circle_at_20%_20%,rgba(37,99,235,.10),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(124,58,237,.10),transparent_25%)]" />
            <div className="relative grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
              <div>
                <Badge className="inline-flex">Decision Intelligence Dashboard</Badge>
                <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">Make every decision count with data.</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg">
                  Combine your history, profile signals, and live decision context in one calm dashboard.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/decision" className="inline-flex">
                    <Button>Start a New Decision <ArrowRight size={16} /></Button>
                  </Link>
                  <Link href="/decision" className="inline-flex">
                    <Button variant="secondary">How it works</Button>
                  </Link>
                </div>
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <MetricCard title="Decision Clarity Score" value={`${Math.round(clarityScore)}%`} detail="Clearer choices over time." />
                  <MetricCard title="Decisions Made" value={`${recent.length}`} detail="Completed reports." />
                  <MetricCard title="Confidence Gained" value={`${Math.max(5, Math.round(profileCompletion / 2))}%`} detail="From profile and history." />
                </div>
              </div>
              <div className="grid gap-4">
                <Card className="ds-glass p-5">
                  <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Score</p>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <ScoreRing value={clarityScore} size={112} />
                    <MiniLineChart points={[24, 38, 34, 52, 61, 72, 81]} />
                  </div>
                </Card>
                <Card className="ds-glass p-5">
                  <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Projection</p>
                  <div className="mt-4 space-y-3">
                    <ComparisonBar leftLabel="Option A" rightLabel="Option B" leftValue={62} rightValue={38} />
                    <ComparisonBar leftLabel="Confidence" rightLabel="Risk" leftValue={74} rightValue={26} />
                  </div>
                </Card>
                <Card className="ds-glass p-5">
                  <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Recommendation preview</p>
                  <div className="mt-3">
                  <RecommendationCard title="FD vs SIP" category="Money" description="A quick, transparent preview of a common money decision." href="/decision/finance/fd-vs-sip" reason="Popular this week" />
                  </div>
                </Card>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {kpis.map((item) => <MetricCard key={item.title} title={item.title} value={item.value} detail={item.detail} icon={item.icon} />)}
          </section>

          <section className="space-y-4">
            <SectionHeader eyebrow="Trending" title="Trending decisions" description="Popular decisions surfacing right now." />
            <div className="flex gap-4 overflow-x-auto pb-1 xl:grid xl:grid-cols-3 xl:overflow-visible">
              {trendingDecisions.slice(0, 6).map((decision) => (
                <div key={decision.id} className="min-w-72 flex-1">
                  <RecommendationCard title={decision.title} category={decision.category} description={decision.description} href={getDecisionRoute(decision.slug) ?? "/decision"} reason="Trending" />
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <SectionHeader eyebrow="Continue" title="Continue your decisions" description="Drafts and recent decisions stay available locally." />
            {loadingMemory ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((index) => <Card key={index} className="h-32 animate-pulse bg-soft" />)}
              </div>
            ) : continueItems.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {drafts.map((draft) => {
                  const workflow = getLiveDecisions().find((decision) => decision.id === draft.workflowId);
                  if (!workflow) return null;
                  return <ContinueDecisionCard key={draft.workflowId + draft.updatedAt} title={workflow.title} category={workflow.category} description="Draft saved on this device" href={`/decision/${draft.pluginId}/${workflow.slug}`} />;
                })}
                {recent.map((item) => {
                  const workflow = getLiveDecisions().find((decision) => decision.id === item.workflowId);
                  if (!workflow) return null;
                  return <ContinueDecisionCard key={item.id} title={workflow.title} category={workflow.category} description="Recent decision" href={`/decision/result/${item.id}`} />;
                })}
              </div>
            ) : (
              <EmptyState title="Start your first decision. It takes less than 3 minutes." description="Your drafts and results will appear here once you start a flow." />
            )}
          </section>

      <section className="space-y-4">
        <SectionHeader eyebrow="Explore" title="Explore by categories" description="Jump into the broad decision categories." />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} title={category.label} description={category.description} href={`/category/${category.id}`} />
          ))}
        </div>
      </section>

          <RecommendedDecisionRail drafts={drafts} recentDecisions={recent} onProfileNudge={() => router.push("/profile")} />

          <section className="space-y-4">
            <SectionHeader eyebrow="AI Insights" title="AI insights" description="A calm summary of what is happening in your decision dashboard." />
            <div className="grid gap-4 xl:grid-cols-[1fr_.8fr]">
              <AIInsightCard title="Decision rhythm">You are completing decisions faster when you start from a category or a saved draft.</AIInsightCard>
              <InsightCard title="Money insight">Money decisions remain the most active area. Explore more investment and planning flows to build confidence.</InsightCard>
            </div>
          </section>

          <section className="space-y-4">
            <SectionHeader eyebrow="More" title="Decision highlights" description="Small signals that help you keep moving." />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Card className="p-5">
                <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Next best booster</p>
                <p className="mt-3 text-lg font-bold">{nextField ?? "Add one detail"}</p>
                <p className="mt-2 text-sm leading-6 text-muted">Improve future decision confidence with one optional profile field.</p>
              </Card>
              <DecisionStreakCard streakDays={retentionSnapshot.activeStreakDays} completedThisWeek={retentionSnapshot.completedThisWeek} />
              <WeeklyProgressCard completedThisWeek={retentionSnapshot.completedThisWeek} reviewedDecisions={retentionSnapshot.reviewedDecisions} categoriesExplored={retentionSnapshot.categoriesExplored} />
            </div>
          </section>

          <section className="space-y-4">
            <SectionHeader eyebrow="Milestones" title="Milestones" description="Earned milestones appear when your activity reaches them." />
            <RetentionMilestones milestones={milestones} />
            {!milestones.length && <ReturnPromptCard title="Keep building your decision library" description="Finish a decision, review an old result, or explore a new category to unlock the first milestone." href="/explore" />}
          </section>

          <section className="space-y-4">
            <SectionHeader eyebrow="Retention" title="Profile and follow-up" description="Keep the dashboard useful without making it noisy." />
            <div className="grid gap-4 lg:grid-cols-[1fr_.9fr]">
              <ProgressiveProfileNudge
                context="money"
                title="Add one detail to improve future decision confidence."
                description={session?.user ? `Next best field: ${nextField ?? "profile detail"}. This stays optional and skippable.` : "Anonymous users can keep exploring, and sign in later for sync benefits."}
                onSkip={() => router.push("/decision")}
                onSaved={() => router.push("/profile")}
              />
              <Card className="p-5">
                <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Bottom AI assistant CTA</p>
                <h3 className="mt-2 text-xl font-bold">Need a quick interpretation?</h3>
                <p className="mt-2 text-sm leading-6 text-muted">Use the assistant to summarize a result or explain a trade-off without leaving the dashboard.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => window.dispatchEvent(new Event("ds-open-assistant"))}>Open AI assistant</Button>
                  <Link href="/profile" className="inline-flex"><Button variant="ghost">Review privacy</Button></Link>
                </div>
              </Card>
            </div>
          </section>
        </div>

        <aside className="mt-8 space-y-4 lg:mt-0">
          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Hero cards</p>
            <div className="mt-4 space-y-3">
              <Card className="p-4">
                <p className="text-sm font-semibold text-muted">Decision score</p>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <ScoreRing value={clarityScore} size={84} />
                  <MiniLineChart points={[18, 29, 41, 49, 58, 67, 74]} />
                </div>
              </Card>
              <Card className="p-4">
                <p className="text-sm font-semibold text-muted">Projection graph</p>
                <MiniLineChart points={[12, 18, 32, 24, 44, 53, 61]} />
              </Card>
              <Card className="p-4">
                <p className="text-sm font-semibold text-muted">Recommendation</p>
                <p className="mt-2 text-sm leading-6 text-muted">Start from a popular comparison or continue a draft to keep the momentum going.</p>
              </Card>
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Quick stats</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-border bg-soft/20 p-4"><p className="text-xs font-bold uppercase tracking-[.12em] text-muted">Saved drafts</p><p className="mt-2 text-2xl font-bold">{drafts.length}</p></div>
              <div className="rounded-2xl border border-border bg-soft/20 p-4"><p className="text-xs font-bold uppercase tracking-[.12em] text-muted">Recent decisions</p><p className="mt-2 text-2xl font-bold">{recent.length}</p></div>
              <div className="rounded-2xl border border-border bg-soft/20 p-4"><p className="text-xs font-bold uppercase tracking-[.12em] text-muted">Profile completeness</p><p className="mt-2 text-2xl font-bold">{Math.round(profileCompletion)}%</p></div>
            </div>
          </Card>

          {!session?.user && (
            <Card className="border-primary/15 bg-primary/[.04] p-5">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Google sign-in</p>
              <h3 className="mt-2 text-xl font-bold">Save and sync across devices</h3>
              <p className="mt-2 text-sm leading-6 text-muted">Anonymous exploration stays available. Sign in only when you want saved decisions and profile sync.</p>
              <GoogleSignInButton className="mt-4 w-full">Sign in with Google</GoogleSignInButton>
            </Card>
          )}

          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">AI insights panel</p>
            <p className="mt-2 text-sm leading-6 text-muted">A lightweight panel for interpretation, trends, and context when you need it.</p>
          </Card>
        </aside>
      </div>

    </div>
  );
}
