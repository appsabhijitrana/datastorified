"use client";

import { CircleAlert, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Card, Button } from "@datastorified/ui";
import type { ProfileAnalysis } from "@datastorified/profile";
import { ProgressBar } from "@datastorified/ui/design-system";

type ConfidenceContext = {
  answerProgress: { answered: number; total: number; requiredAnswered?: number; requiredTotal?: number };
  profileAnalysis?: Pick<ProfileAnalysis, "label" | "description" | "nextBestField" | "percentage">;
  decisionSignals?: number;
  assumptions?: string[];
};

export function getDecisionConfidence(context: ConfidenceContext) {
  const answerCompletion = context.answerProgress.total > 0 ? (context.answerProgress.answered / context.answerProgress.total) * 100 : 0;
  const requiredCompletion = context.answerProgress.requiredTotal && context.answerProgress.requiredTotal > 0
    ? (context.answerProgress.requiredAnswered ?? 0) / context.answerProgress.requiredTotal * 100
    : answerCompletion;
  const profileCompleteness = context.profileAnalysis?.percentage ?? 0;
  const signals = Math.min(100, Math.max(0, (context.decisionSignals ?? 0) * 18));
  const assumptionsPenalty = Math.min(12, (context.assumptions?.length ?? 0) * 3);

  const score = Math.round(
    clamp(
      (answerCompletion * 0.34) +
        (requiredCompletion * 0.28) +
        (profileCompleteness * 0.2) +
        (signals * 0.18) -
        assumptionsPenalty,
      0,
      100,
    ),
  );

  const missingSignals = [
    context.answerProgress.requiredAnswered !== undefined && context.answerProgress.requiredTotal !== undefined && context.answerProgress.requiredAnswered < context.answerProgress.requiredTotal
      ? "Finish required answers"
      : null,
    context.answerProgress.answered < context.answerProgress.total ? "Answer a few more questions" : null,
    context.profileAnalysis?.nextBestField?.label ? `Add ${context.profileAnalysis.nextBestField.label.toLowerCase()}` : null,
    (context.assumptions?.length ?? 0) > 0 ? "Review assumptions" : null,
  ].filter(Boolean) as string[];

  return {
    score,
    answerCompletion: Math.round(answerCompletion),
    requiredCompletion: Math.round(requiredCompletion),
    profileCompleteness: Math.round(profileCompleteness),
    missingSignals,
    profileHint: context.profileAnalysis?.nextBestField,
  };
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
          <h3 className="mt-1 text-xl font-bold">{confidence.score}%</h3>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/15 bg-success/[.07] px-3 py-1.5 text-xs font-bold text-success">
          <ShieldCheck size={14} />
          Preview confidence
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p>
      <div className="mt-4">
        <ProgressBar value={confidence.score} label="Confidence preview" />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MiniStat label="Answers" value={`${confidence.answerCompletion}%`} />
        <MiniStat label="Profile" value={`${confidence.profileCompleteness}%`} />
        <MiniStat label="Required" value={`${confidence.requiredCompletion}%`} />
      </div>
    </Card>
  );
}

export function ProfileCompletenessImpact({
  analysis,
}: {
  analysis: Pick<ProfileAnalysis, "label" | "description" | "nextBestField" | "percentage">;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/[.08] text-primary">
          <UserRound size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Profile completeness impact</p>
          <h3 className="mt-1 text-lg font-bold">{Math.round(analysis.percentage)}% profile completeness</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{analysis.description}</p>
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
        {signals.length ? signals.map((signal) => <li key={signal} className="text-sm leading-6 text-muted">• {signal}</li>) : <li className="text-sm leading-6 text-muted">No major gaps right now.</li>}
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
        description: confidence.profileHint?.description ?? "Add one detail to improve future decision confidence.",
        nextBestField: confidence.profileHint,
        percentage: confidence.profileCompleteness,
      }} />
      {showMissingSignals && <MissingSignalList signals={confidence.missingSignals} />}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-muted">{label}</p>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
