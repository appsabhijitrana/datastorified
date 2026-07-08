"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Flame, RotateCcw, Sparkles } from "lucide-react";
import { Button, Card } from "@datastorified/ui";
import { Badge, ProgressBar } from "@datastorified/ui/design-system";

export type RetentionSnapshot = {
  completedThisWeek: number;
  activeStreakDays: number;
  categoriesExplored: number;
  profileImprovements: number;
  reviewedDecisions: number;
};

export type RetentionMilestoneId =
  | "first-decision"
  | "three-decisions"
  | "money-explorer"
  | "scenario-explorer"
  | "profile-builder"
  | "review-ready";

export type RetentionMilestone = {
  id: RetentionMilestoneId;
  title: string;
  description: string;
  earned: boolean;
};

export function buildRetentionSnapshot({
  completedThisWeek,
  activeStreakDays,
  categoriesExplored,
  profileImprovements,
  reviewedDecisions,
}: RetentionSnapshot): RetentionSnapshot {
  return {
    completedThisWeek,
    activeStreakDays,
    categoriesExplored,
    profileImprovements,
    reviewedDecisions,
  };
}

export function buildRetentionMilestones(snapshot: RetentionSnapshot): RetentionMilestone[] {
  return [
    { id: "first-decision" as const, title: "First Decision", description: "Complete your first decision report.", earned: snapshot.completedThisWeek + snapshot.reviewedDecisions > 0 },
    { id: "three-decisions" as const, title: "3 Decisions Completed", description: "Finish three decisions across the library.", earned: snapshot.completedThisWeek + snapshot.reviewedDecisions >= 3 },
    { id: "money-explorer" as const, title: "Money Explorer", description: "Explore at least one Money decision.", earned: snapshot.categoriesExplored >= 1 },
    { id: "scenario-explorer" as const, title: "Scenario Explorer", description: "Use scenario comparison at least once.", earned: snapshot.reviewedDecisions > 0 || snapshot.completedThisWeek > 0 },
    { id: "profile-builder" as const, title: "Profile Builder", description: "Improve decision accuracy with profile details.", earned: snapshot.profileImprovements > 0 },
    { id: "review-ready" as const, title: "Review Ready", description: "Set up at least one decision review.", earned: snapshot.reviewedDecisions > 0 },
  ].filter((milestone) => milestone.earned) as RetentionMilestone[];
}

export function DecisionStreakCard({ streakDays, completedThisWeek }: { streakDays: number; completedThisWeek: number }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Decision streak</p>
          <h3 className="mt-2 text-xl font-bold">Keep momentum going</h3>
          <p className="mt-2 text-sm leading-6 text-muted">A steady rhythm helps you revisit assumptions without turning the experience into a race.</p>
        </div>
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/[.08] text-primary">
          <Flame size={18} />
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Metric label="Active streak days" value={`${streakDays}`} />
        <Metric label="Completed this week" value={`${completedThisWeek}`} />
      </div>
    </Card>
  );
}

export function WeeklyProgressCard({ completedThisWeek, reviewedDecisions, categoriesExplored }: { completedThisWeek: number; reviewedDecisions: number; categoriesExplored: number }) {
  const total = Math.max(1, 5);
  const value = Math.min(100, Math.round(((completedThisWeek + reviewedDecisions + categoriesExplored) / total) * 100));
  return (
    <Card className="p-5">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Weekly progress</p>
      <h3 className="mt-2 text-xl font-bold">Professional retention, not pressure</h3>
      <p className="mt-2 text-sm leading-6 text-muted">A quiet summary of useful activity this week.</p>
      <div className="mt-4">
        <ProgressBar value={value} label="Weekly activity" />
      </div>
      <div className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-3">
        <MiniStat label="Completed" value={completedThisWeek} />
        <MiniStat label="Reviewed" value={reviewedDecisions} />
        <MiniStat label="Categories" value={categoriesExplored} />
      </div>
    </Card>
  );
}

export function MilestoneBadge({ title, description }: { title: string; description: string }) {
  return (
    <Badge className="inline-flex min-h-9 items-center gap-1.5 border-primary/15 bg-primary/[.06] px-3 text-xs font-semibold text-primary">
      <BadgeCheck size={14} />
      <span>{title}</span>
      <span className="text-muted">·</span>
      <span className="text-muted">{description}</span>
    </Badge>
  );
}

export function ReturnPromptCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Card className="border-primary/15 bg-gradient-to-br from-primary/[.05] to-accent/[.06] p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-primary shadow-soft">
          <RotateCcw size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Return prompt</p>
          <h3 className="mt-2 text-xl font-bold">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
          <Link href={href} className="mt-4 inline-flex">
            <Button variant="secondary">Continue journey <ArrowRight size={16} /></Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

export function ContinueJourneyCTA({ href, label = "Continue journey" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="inline-flex">
      <Button>
        <Sparkles size={16} />
        {label}
        <ArrowRight size={16} />
      </Button>
    </Link>
  );
}

export function RetentionMilestones({ milestones }: { milestones: RetentionMilestone[] }) {
  if (!milestones.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {milestones.map((milestone) => (
        <MilestoneBadge key={milestone.id} title={milestone.title} description={milestone.description} />
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-soft/20 p-3">
      <p className="text-xs font-bold uppercase tracking-[.12em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-3">
      <p className="text-xs font-bold uppercase tracking-[.12em] text-muted">{label}</p>
      <p className="mt-1 text-lg font-bold text-ink">{value}</p>
    </div>
  );
}
