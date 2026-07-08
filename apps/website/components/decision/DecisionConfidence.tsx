"use client";

import { CircleAlert, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Card, Button } from "@datastorified/ui";
import type { ProfileAnalysis } from "@datastorified/profile";
import { ProgressBar } from "@datastorified/ui/design-system";
import { calculateDecisionConfidence, type DecisionConfidenceCalculatorInput, MissingSignalList as EngineMissingSignalList, ProfileCompletionScore, ProfileCompletenessRing, ConfidenceImpactPreview } from "./ProfileConfidenceEngine";

type ConfidenceContext = DecisionConfidenceCalculatorInput;

export function getDecisionConfidence(context: ConfidenceContext) {
  return calculateDecisionConfidence(context);
}

export function DecisionConfidenceCard({
  confidence,
  title = "Decision confidence",
  subtitle = "Visible confidence, not a final recommendation.",
}: {
  confidence: ReturnType<typeof getDecisionConfidence>;
  title?: string;
  subtitle?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">{title}</p>
          <h3 className="mt-1 text-xl font-bold">{confidence.currentConfidence}%</h3>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/15 bg-success/[.07] px-3 py-1.5 text-xs font-bold text-success">
          <ShieldCheck size={14} />
          Preview confidence
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p>
      <div className="mt-4">
        <ProgressBar value={confidence.currentConfidence} label="Confidence preview" />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MiniStat label="Answers" value={`${confidence.currentConfidence}%`} />
        <MiniStat label="Profile" value={`${confidence.profileCompleteness}%`} />
        <MiniStat label="Band" value={confidence.confidenceBand} />
      </div>
    </Card>
  );
}

export function ProfileCompletenessImpact({
  analysis,
}: {
  analysis: Pick<ProfileAnalysis, "label" | "description" | "nextBestField" | "percentage">;
}) {
  const ring = ProfileCompletenessRing({ value: analysis.percentage });
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/[.08] text-primary">
          <UserRound size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Profile completeness impact</p>
          <h3 className="mt-1 text-lg font-bold">{ProfileCompletionScore({ value: analysis.percentage })} profile completeness</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{analysis.description}</p>
          <p className="mt-2 text-xs text-muted">Ring progress {ring.value}%.</p>
        </div>
      </div>
    </Card>
  );
}

export function ConfidenceImprovementNudge({
  title,
  description,
  actionLabel = "Add one detail",
  onAction,
  onSkip,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction: () => void;
  onSkip: () => void;
}) {
  return (
    <Card className="border-primary/15 bg-gradient-to-br from-primary/[.05] to-accent/[.07] p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-primary shadow-sm">
          <Sparkles size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Improve confidence</p>
          <h3 className="mt-1 text-lg font-bold">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onAction}>{actionLabel}</Button>
            <Button variant="ghost" onClick={onSkip}>Skip</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function MissingSignalList({ signals }: { signals: string[] }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <CircleAlert size={16} className="text-primary" />
        <p className="text-sm font-bold uppercase tracking-[.14em] text-primary">Missing signals</p>
      </div>
      <ul className="mt-3 space-y-2">
        {EngineMissingSignalList({ signals }).map((signal) => <li key={signal} className="text-sm leading-6 text-muted">• {signal}</li>)}
      </ul>
    </Card>
  );
}

export function DecisionConfidenceSummary({
  confidence,
  showMissingSignals = true,
}: {
  confidence: ReturnType<typeof getDecisionConfidence>;
  showMissingSignals?: boolean;
}) {
  return (
    <div className="space-y-4">
      <DecisionConfidenceCard confidence={confidence} />
      <ProfileCompletenessImpact analysis={{
        label: "Decision confidence",
        description: confidence.profileAnalysis?.description ?? "Add one detail to improve future decision confidence.",
        nextBestField: confidence.profileAnalysis?.nextBestField,
        percentage: confidence.profileCompleteness,
      }} />
      {showMissingSignals && <MissingSignalList signals={confidence.missingSignals} />}
    </div>
  );
}

export { ProfileCompletionScore, ConfidenceImpactPreview, ProfileCompletenessRing };

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-muted">{label}</p>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}
