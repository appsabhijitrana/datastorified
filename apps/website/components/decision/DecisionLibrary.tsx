"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3, RefreshCcw, TimerReset, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card } from "@datastorified/ui";
import { authClient, GoogleSignInButton, LegalAcceptanceGate } from "@datastorified/auth";
import { decisionPluginRegistry, type DecisionMemoryDraft, type StoredDecision } from "@datastorified/decision-os";
import { DecisionOrchestrator } from "@datastorified/decision-os/core/orchestrator";
import { getDecisionAdapters } from "@datastorified/decision-os/adapters";
import { HybridDecisionRepository } from "@datastorified/decision-repository";
import { getDecisionReviewReminder } from "./DecisionReviewReminder";
import { DecisionRetentionLoop } from "./DecisionRetentionLoop";
import { DecisionStreakCard, RetentionMilestones, WeeklyProgressCard, buildRetentionMilestones, buildRetentionSnapshot } from "../retention/RetentionHooks";

type LibraryTab = "all" | "drafts" | "completed" | "saved" | "needs-review";

export function DecisionLibrary() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const repository = useMemo(() => new HybridDecisionRepository({ authenticated: Boolean(session?.user) }), [session?.user]);
  const orchestrator = useMemo(() => new DecisionOrchestrator({ repository }), [repository]);
  const adapters = getDecisionAdapters();
  const [saved, setSaved] = useState<StoredDecision[]>([]);
  const [drafts, setDrafts] = useState<DecisionMemoryDraft[]>([]);
  const [profileLastOpenedWorkflow, setProfileLastOpenedWorkflow] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LibraryTab>("all");

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    void Promise.all([orchestrator.listSavedDecisions(), orchestrator.listDrafts(), adapters.memory.getProfile()])
      .then(([savedItems, draftItems, profile]) => {
        setSaved(savedItems);
        setDrafts(draftItems);
        setProfileLastOpenedWorkflow(profile.lastOpenedWorkflow?.workflowId ?? null);
      })
      .catch(() => setError("Could not load your decision library right now."))
      .finally(() => setLoading(false));
  }, [adapters.memory, orchestrator]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const items = useMemo(() => buildLibraryItems(saved, drafts), [saved, drafts]);
  const stats = useMemo(() => ({
    completed: items.filter((item) => item.kind === "saved").length,
    drafts: items.filter((item) => item.kind === "draft").length,
    needsReview: items.filter((item) => item.needsReview).length,
    streak: calculateStreak(items),
  }), [items]);
  const filtered = useMemo(() => filterItems(items, activeTab), [activeTab, items]);
  const retentionSnapshot = useMemo(() => buildRetentionSnapshot({
    completedThisWeek: items.filter((item) => item.kind === "saved").length,
    activeStreakDays: calculateStreak(items),
    categoriesExplored: new Set(items.map((item) => item.category)).size,
    profileImprovements: Math.max(0, items.filter((item) => item.kind === "saved").length - 1),
    reviewedDecisions: items.filter((item) => item.needsReview).length,
  }), [items]);
  const milestones = useMemo(() => buildRetentionMilestones(retentionSnapshot), [retentionSnapshot]);
  const lastWorkflow = useMemo(() => {
    const workflowId = profileLastOpenedWorkflow ?? drafts[0]?.workflowId ?? saved[0]?.workflowId;
    if (!workflowId) return undefined;
    return decisionPluginRegistry.getWorkflow(workflowId);
  }, [drafts, profileLastOpenedWorkflow, saved]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge>Decision library</Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-[-.035em] sm:text-4xl">My Decisions</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted">A personal library of drafts, saved decisions, completed reports, and items that need review.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={refresh}><RefreshCcw size={16} /> Refresh</Button>
          <Button onClick={() => router.push("/decision")}>Start a new decision</Button>
        </div>
      </div>

      {!session?.user && (
        <Card className="mt-8 border-primary/15 bg-primary/[.04] p-5">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Anonymous mode</p>
          <h2 className="mt-2 text-xl font-bold">Your library is still available locally.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Sign in with Google later if you want these decisions and profile details to sync across devices.</p>
          <GoogleSignInButton className="mt-4">Sign in with Google</GoogleSignInButton>
        </Card>
      )}

      {loading ? (
        <div className="mt-10 grid gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => <Card key={index} className="h-28 animate-pulse rounded-3xl bg-soft" />)}
        </div>
      ) : error ? (
        <Card className="mt-10 p-6" role="alert">
          <p className="text-sm font-semibold text-danger">{error}</p>
          <Button className="mt-4" variant="secondary" onClick={refresh}>Try again</Button>
        </Card>
      ) : (
        <LegalAcceptanceGate mode="account">
          <section className="mt-8">
            <DecisionLibraryStats
              completedDecisions={stats.completed}
              activeDrafts={stats.drafts}
              needsReview={stats.needsReview}
              decisionStreak={stats.streak}
            />
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_.9fr]">
            <DecisionStreakCard streakDays={retentionSnapshot.activeStreakDays} completedThisWeek={retentionSnapshot.completedThisWeek} />
            <WeeklyProgressCard completedThisWeek={retentionSnapshot.completedThisWeek} reviewedDecisions={retentionSnapshot.reviewedDecisions} categoriesExplored={retentionSnapshot.categoriesExplored} />
          </section>

          <section className="mt-8 space-y-4">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Milestones</p>
            <RetentionMilestones milestones={milestones} />
          </section>

          {lastWorkflow?.title && (
            <section className="mt-8">
              <Card className="border-primary/15 bg-primary/[.04] p-5">
                <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Resume last workflow</p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-bold">{lastWorkflow.title}</p>
                    <p className="mt-1 text-sm text-muted">Continue where you left off.</p>
                  </div>
                  <Button variant="secondary" onClick={() => router.push(`/decision/${lastWorkflow.pluginId}/${lastWorkflow.slug}`)}>Continue</Button>
                </div>
              </Card>
            </section>
          )}

          <section className="mt-8">
            <DecisionLibraryTabs active={activeTab} onChange={setActiveTab} />
          </section>

          <section className="mt-6">
            {filtered.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {filtered.map((item) => (
                  <DecisionLibraryCard key={item.id} item={item} onDelete={() => {
                    if (item.kind === "draft") {
                      void orchestrator.clearDraft(item.workflowId).then(refresh);
                    } else {
                      void orchestrator.deleteDecision(item.id).then(refresh);
                    }
                  }} />
                ))}
              </div>
            ) : (
              <LibraryEmptyState title="No decisions in this tab yet." description="Try another tab or start a new decision." onBrowse={() => router.push("/decision")} />
            )}
          </section>

          <section className="mt-10 grid gap-4 lg:grid-cols-[1fr_.8fr]">
            <DraftsSection items={items.filter((item) => item.kind === "draft")} onContinue={(href) => router.push(href)} />
            <NeedsReviewSection items={items.filter((item) => item.needsReview)} />
          </section>

          <section className="mt-10 grid gap-4 lg:grid-cols-[1fr_.8fr]">
            <CompletedSection items={items.filter((item) => item.kind === "saved" && item.status === "Completed")} />
            <SavedSection items={items.filter((item) => item.kind === "saved")} />
          </section>

          {lastWorkflow?.slug && (
            <section className="mt-10">
              <DecisionRetentionLoop slug={lastWorkflow.slug} />
            </section>
          )}
        </LegalAcceptanceGate>
      )}
    </main>
  );
}

export function DecisionLibraryTabs({ active, onChange }: { active: LibraryTab; onChange: (tab: LibraryTab) => void; }) {
  const tabs: Array<{ id: LibraryTab; label: string }> = [
    { id: "all", label: "All" },
    { id: "drafts", label: "Drafts" },
    { id: "completed", label: "Completed" },
    { id: "saved", label: "Saved" },
    { id: "needs-review", label: "Needs Review" },
  ];
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold ${active === tab.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-white text-muted"}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function DecisionStatusFilter({ status }: { status: string }) {
  return <Badge className="capitalize">{status}</Badge>;
}

export function DecisionLibraryStats({
  completedDecisions,
  activeDrafts,
  needsReview,
  decisionStreak,
}: {
  completedDecisions: number;
  activeDrafts: number;
  needsReview: number;
  decisionStreak: number;
}) {
  const stats = [
    { label: "Completed decisions", value: completedDecisions, icon: <CheckCircle2 size={16} /> },
    { label: "Active drafts", value: activeDrafts, icon: <Clock3 size={16} /> },
    { label: "Needs review", value: needsReview, icon: <AlertTriangle size={16} /> },
    { label: "Decision streak", value: decisionStreak, icon: <TimerReset size={16} /> },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => (
        <Card key={item.label} className="p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-muted">{item.label}</p>
            <span className="text-primary">{item.icon}</span>
          </div>
          <p className="mt-3 text-3xl font-bold">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}

export function DecisionLibraryCard({ item, onDelete }: { item: LibraryItem; onDelete?: () => void; }) {
  const workflow = decisionPluginRegistry.getWorkflow(item.workflowId);
  const href = item.kind === "draft" ? `/decision/${item.pluginId}/${workflow?.slug ?? item.workflowId}` : item.kind === "saved" ? `/decision/result/${item.id}` : `/decision/result/${item.id}`;
  const cta = item.kind === "draft" ? "Continue" : "View Report";
  const reminder = getDecisionReviewReminder(item.workflowId);
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge>{item.category}</Badge>
          <h3 className="mt-3 text-lg font-bold">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{item.kind === "draft" ? "Draft in progress" : item.status}</p>
        </div>
        <DecisionStatusFilter status={item.status} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Meta label="Suitability score" value={`${item.score}%`} />
        <Meta label="Confidence" value={`${item.confidence}%`} />
        <Meta label="Last updated" value={formatDate(item.updatedAt)} />
        <Meta label="Review date" value={item.reviewDate ? formatDate(item.reviewDate) : reminder?.nextReviewAt ? formatDate(reminder.nextReviewAt) : "Not set"} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={href}>
          <Button>{cta} <ArrowRight size={16} /></Button>
        </Link>
        {onDelete && <Button variant="secondary" onClick={onDelete}><Trash2 size={16} /> Remove</Button>}
      </div>
    </Card>
  );
}

export function NeedsReviewSection({ items }: { items: LibraryItem[] }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Needs review</p>
      <div className="mt-4 space-y-3">
        {items.length ? items.map((item) => <DecisionLibraryCard key={item.id} item={item} />) : <LibraryEmptyState compact title="No decisions need review right now." description="When reminders are due, they will appear here." />}
      </div>
    </Card>
  );
}

export function DraftsSection({ items, onContinue }: { items: LibraryItem[]; onContinue: (href: string) => void; }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Drafts</p>
      <div className="mt-4 space-y-3">
        {items.length ? items.map((item) => <DecisionLibraryCard key={item.id} item={item} />) : <LibraryEmptyState compact title="No drafts in progress." description="Start a decision and autosave will capture it here." onBrowse={() => onContinue("/decision")} />}
      </div>
    </Card>
  );
}

export function CompletedSection({ items }: { items: LibraryItem[] }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Completed</p>
      <div className="mt-4 space-y-3">
        {items.length ? items.map((item) => <DecisionLibraryCard key={item.id} item={item} />) : <LibraryEmptyState compact title="No completed decisions yet." description="Finish a decision flow to build your library." />}
      </div>
    </Card>
  );
}

export function SavedSection({ items }: { items: LibraryItem[] }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Saved</p>
      <div className="mt-4 space-y-3">
        {items.length ? items.map((item) => <DecisionLibraryCard key={item.id} item={item} />) : <LibraryEmptyState compact title="No saved decisions yet." description="Save a result to keep it in this section." />}
      </div>
    </Card>
  );
}

type LibraryItem = {
  id: string;
  workflowId: string;
  pluginId: string;
  title: string;
  category: string;
  status: string;
  kind: "draft" | "saved";
  score: number;
  confidence: number;
  updatedAt: string;
  reviewDate?: string;
  needsReview: boolean;
};

function buildLibraryItems(saved: StoredDecision[], drafts: DecisionMemoryDraft[]): LibraryItem[] {
  const savedItems = saved.map((item) => {
    const workflow = decisionPluginRegistry.getWorkflow(item.workflowId);
    const reminder = getDecisionReviewReminder(item.workflowId);
    const score = Math.round(item.report?.score.value ?? item.report?.score.percentage ?? 0);
    return {
      id: item.id,
      workflowId: item.workflowId,
      pluginId: item.pluginId,
      title: workflow?.title ?? item.workflowId,
      category: workflow?.category ?? "Decision",
      status: reminder?.nextReviewAt && Date.now() >= new Date(reminder.nextReviewAt).getTime() ? "Needs review" : "Completed",
      kind: "saved" as const,
      score,
      confidence: Math.round(item.report?.score.percentage ?? score),
      updatedAt: item.updatedAt,
      reviewDate: reminder?.nextReviewAt,
      needsReview: Boolean(reminder?.nextReviewAt && Date.now() >= new Date(reminder.nextReviewAt).getTime()),
    };
  });
  const draftItems = drafts.map((item) => {
    const workflow = decisionPluginRegistry.getWorkflow(item.workflowId);
    return {
      id: `${item.workflowId}:${item.updatedAt}`,
      workflowId: item.workflowId,
      pluginId: item.pluginId,
      title: workflow?.title ?? item.workflowId,
      category: workflow?.category ?? "Decision",
      status: "Draft",
      kind: "draft" as const,
      score: 0,
      confidence: 0,
      updatedAt: item.updatedAt,
      reviewDate: undefined,
      needsReview: false,
    };
  });
  return [...draftItems, ...savedItems].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function filterItems(items: LibraryItem[], activeTab: LibraryTab): LibraryItem[] {
  if (activeTab === "drafts") return items.filter((item) => item.kind === "draft");
  if (activeTab === "completed") return items.filter((item) => item.kind === "saved");
  if (activeTab === "saved") return items.filter((item) => item.kind === "saved");
  if (activeTab === "needs-review") return items.filter((item) => item.needsReview);
  return items;
}

function calculateStreak(items: LibraryItem[]) {
  const days = new Set(items.map((item) => new Date(item.updatedAt).toDateString()));
  return Math.min(7, days.size);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN");
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-soft/20 p-4">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function LibraryEmptyState({ title, description, compact = false, onBrowse }: { title: string; description: string; compact?: boolean; onBrowse?: () => void; }) {
  return (
    <div className={`rounded-3xl border border-dashed border-border bg-soft/20 ${compact ? "p-4" : "p-8 text-center"}`}>
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      {onBrowse && <Button className="mt-4" onClick={onBrowse}>Browse decisions</Button>}
    </div>
  );
}
