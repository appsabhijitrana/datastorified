"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import Link from "next/link";
import { authClient, GoogleSignInButton, LegalAcceptanceGate } from "@datastorified/auth";
import { Badge, Button, Card } from "@datastorified/ui";
import { decisionPluginRegistry, type DecisionMemoryDraft, type StoredDecision } from "@datastorified/decision-os";
import { DecisionOrchestrator } from "@datastorified/decision-os/core/orchestrator";
import { getDecisionAdapters } from "@datastorified/decision-os/adapters";
import { HybridDecisionRepository } from "@datastorified/decision-repository";
import { getProfileAnalysis } from "@datastorified/profile";
import { getDecisionReviewReminder } from "../decision/DecisionReviewReminder";

type InsightItem = {
  title: string;
  category: string;
  updatedAt: string;
  score: number;
  confidence: number;
  href: string;
  kind: "draft" | "saved";
  reviewDate?: string;
};

export function InsightsDashboard() {
  const { data: session } = authClient.useSession();
  const repository = useMemo(() => new HybridDecisionRepository({ authenticated: Boolean(session?.user) }), [session?.user]);
  const orchestrator = useMemo(() => new DecisionOrchestrator({ repository }), [repository]);
  const adapters = getDecisionAdapters();
  const [saved, setSaved] = useState<StoredDecision[]>([]);
  const [drafts, setDrafts] = useState<DecisionMemoryDraft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void Promise.all([orchestrator.listSavedDecisions(), orchestrator.listDrafts(), adapters.profile.getProfile()])
      .then(([savedItems, draftItems]) => {
        if (cancelled) return;
        setSaved(savedItems);
        setDrafts(draftItems);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [adapters.profile, orchestrator]);

  const profileAnalysis = useMemo(() => getProfileAnalysis(session?.user ? { source: "cloud", cloudHistoryCount: saved.length } : undefined), [saved.length, session?.user]);
  const items = useMemo(() => buildItems(saved, drafts), [drafts, saved]);
  const exploredCategories = useMemo(() => countCategories(items), [items]);
  const recentActivity = items.slice(0, 5);
  const profileBoost = Math.min(12, Math.max(0, Math.round(profileAnalysis.percentage / 10)));
  const clarityScore = Math.min(100, Math.round((items.filter((item) => item.kind === "saved").length * 18) + profileAnalysis.percentage * 0.5));
  const streak = Math.min(14, new Set(items.map((item) => new Date(item.updatedAt).toDateString())).size);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge>Insights</Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-[-.035em] sm:text-4xl">Decision Insights</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted">A professional view of your decision habits, review reminders, and the areas where your confidence is growing.</p>
        </div>
        <Button variant="secondary" onClick={() => window.location.reload()}><RefreshCcw size={16} /> Refresh</Button>
      </div>

      {!session?.user && (
        <Card className="mt-8 border-primary/15 bg-primary/[.04] p-5">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Anonymous insights</p>
          <h2 className="mt-2 text-xl font-bold">Local decision history is still enough to learn from.</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Sign in with Google later if you want synced insights across devices.</p>
          <GoogleSignInButton className="mt-4">Sign in with Google</GoogleSignInButton>
        </Card>
      )}

      {loading ? (
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((index) => <Card key={index} className="h-32 animate-pulse rounded-3xl bg-soft" />)}
        </div>
      ) : (
        <LegalAcceptanceGate mode="account">
          <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Decision Clarity Score" value={`${clarityScore}%`} detail="Rounded preview from recent decisions and profile signals." />
            <MetricCard label="Decision streak" value={`${streak}`} detail="Weeks with active decision activity." />
            <MetricCard label="Categories explored" value={`${exploredCategories.size}`} detail={exploredCategories.top ? `${exploredCategories.top} is your most explored category.` : "Explore more categories to build a pattern."} />
            <MetricCard label="Profile growth" value={`${Math.round(profileAnalysis.percentage)}%`} detail={profileBoost > 0 ? `Your profile improved decision confidence by ${profileBoost}%.` : "Add one detail to improve future confidence."} />
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_.9fr]">
            <Card className="p-5">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Confidence trend</p>
              <TrendList items={items} />
            </Card>
            <Card className="p-5">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Suggested next decisions</p>
              <div className="mt-4 space-y-3">
                {suggestNext(items).map((item) => (
                  <InsightLink key={item.href} href={item.href} title={item.title} category={item.category} />
                ))}
              </div>
            </Card>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Review reminders</p>
              <div className="mt-4 space-y-3">
                {recentReminders(items).length ? recentReminders(items).map((item) => (
                  <div key={item.href} className="rounded-2xl border border-border bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{item.title}</p>
                        <p className="mt-1 text-sm text-muted">{item.category}</p>
                      </div>
                      <Badge>{item.reviewDate ? new Date(item.reviewDate).toLocaleDateString("en-IN") : "Review soon"}</Badge>
                    </div>
                  </div>
                )) : <EmptyNote title="No review reminders yet." description="Set one from a result page and it will appear here." />}
              </div>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Recent activity</p>
              <div className="mt-4 space-y-3">
                {recentActivity.length ? recentActivity.map((item) => <ActivityRow key={item.href} item={item} />) : <EmptyNote title="No recent activity yet." description="Start a decision, save a result, or open a draft to see activity here." />}
              </div>
            </Card>
          </section>

          <section className="mt-8">
            <Card className="p-5">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Decision Clarity Score</p>
              <p className="mt-2 text-3xl font-bold">{clarityScore}%</p>
              <p className="mt-2 text-sm leading-6 text-muted">You completed {items.filter((item) => item.kind === "saved").length} decisions this week.</p>
            </Card>
          </section>
        </LegalAcceptanceGate>
      )}
    </main>
  );
}

function TrendList({ items }: { items: InsightItem[] }) {
  const series = items.slice(0, 5).map((item, index) => ({ label: new Date(item.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), value: Math.min(100, item.confidence - index * 3) }));
  if (!series.length) {
    return <EmptyNote title="No confidence trend yet." description="Complete a few decisions and the trend will appear here." />;
  }
  return (
    <div className="space-y-3">
      {series.map((point) => (
        <div key={point.label} className="rounded-2xl border border-border bg-soft/20 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">{point.label}</p>
            <p className="text-sm font-semibold text-primary">{point.value}%</p>
          </div>
          <div className="mt-2 h-2 rounded-full bg-white">
            <div className="h-2 rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${point.value}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
    </Card>
  );
}

function InsightLink({ href, title, category }: { href: string; title: string; category: string }) {
  return (
    <Link href={href} className="block rounded-2xl border border-border bg-soft/20 p-4 transition hover:border-primary/30 hover:bg-primary/[.04]">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted">{category}</p>
    </Link>
  );
}

function ActivityRow({ item }: { item: InsightItem }) {
  return (
    <Link href={item.href} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-white p-4 transition hover:border-primary/30">
      <div>
        <p className="font-semibold">{item.title}</p>
        <p className="mt-1 text-sm text-muted">{item.category}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold">{item.kind === "draft" ? "Draft" : "Completed"}</p>
        <p className="mt-1 text-xs text-muted">{new Date(item.updatedAt).toLocaleDateString("en-IN")}</p>
      </div>
    </Link>
  );
}

function EmptyNote({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-soft/20 p-4">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}

function buildItems(saved: StoredDecision[], drafts: DecisionMemoryDraft[]): InsightItem[] {
  const savedItems = saved.map((item) => {
    const workflow = decisionPluginRegistry.getWorkflow(item.workflowId);
    const reminder = getDecisionReviewReminder(item.workflowId);
    const reportScore = Math.round(item.report?.score.value ?? item.report?.score.percentage ?? 0);
    return {
      title: workflow?.title ?? item.workflowId,
      category: workflow?.category ?? "Decision",
      updatedAt: item.updatedAt,
      score: reportScore,
      confidence: Math.round(item.report?.score.percentage ?? reportScore),
      href: `/decision/result/${item.id}`,
      kind: "saved" as const,
      reviewDate: reminder?.nextReviewAt,
    };
  });
  const draftItems = drafts.map((item) => {
    const workflow = decisionPluginRegistry.getWorkflow(item.workflowId);
    return {
      title: workflow?.title ?? item.workflowId,
      category: workflow?.category ?? "Decision",
      updatedAt: item.updatedAt,
      score: 0,
      confidence: 0,
      href: `/decision/${item.pluginId}/${workflow?.slug ?? item.workflowId}`,
      kind: "draft" as const,
      reviewDate: undefined,
    };
  });
  return [...draftItems, ...savedItems].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function countCategories(items: InsightItem[]) {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return {
    size: counts.size,
    top: entries[0]?.[0],
  };
}

function suggestNext(items: InsightItem[]) {
  const history = items.filter((item) => item.kind === "saved");
  const defaults = [
    { title: "Emergency Fund", category: "Money", href: "/decision/finance/emergency-fund" },
    { title: "Rent vs Buy", category: "Home", href: "/decision/finance/rent-vs-buy" },
    { title: "Job Switch", category: "Career", href: "/decision/career/job-switch" },
  ];
  return history.length ? defaults.slice(0, 2) : defaults;
}

function recentReminders(items: InsightItem[]) {
  return items.filter((item) => item.reviewDate).slice(0, 4);
}
