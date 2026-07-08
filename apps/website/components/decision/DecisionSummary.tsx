"use client";

import type { ReactNode } from "react";
import { Clock3, Gauge, ShieldAlert, Sparkles, UserRound } from "lucide-react";
import { Card } from "@datastorified/ui";
import { ProgressRing } from "@datastorified/ui/library";
import type { DecisionReport } from "@datastorified/decision-os";
import type { ProfileAnalysis } from "@datastorified/profile";

export function DecisionSummary({
  workflowTitle,
  category,
  report,
  profileAnalysis,
  completedAt,
  bestMatchLabel,
  reviewSuggestion,
}: {
  workflowTitle: string;
  category?: string;
  report: DecisionReport;
  profileAnalysis?: Pick<ProfileAnalysis, "label" | "description" | "nextBestField" | "percentage">;
  completedAt: string;
  bestMatchLabel: string;
  reviewSuggestion: string;
}) {
  const score = Math.round(report.score.value);
  const confidence = Math.round(report.score.percentage ?? report.score.value);
  const risk = getRiskLabel(report);
  const summaryCopy = `Based on your answers, ${bestMatchLabel} achieved the highest suitability score.`;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <DecisionScoreHero
        title={workflowTitle}
        category={category}
        summaryCopy={summaryCopy}
        score={score}
        confidence={confidence}
        risk={risk}
        profileCompleteness={profileAnalysis ? Math.round(profileAnalysis.percentage) : 0}
        bestMatchLabel={bestMatchLabel}
      />
      <ResultMetadataCard
        completedAt={completedAt}
        reviewSuggestion={reviewSuggestion}
        risk={risk}
        confidence={confidence}
        profileCompleteness={profileAnalysis ? Math.round(profileAnalysis.percentage) : 0}
        profileLabel={profileAnalysis?.label}
      />
    </div>
  );
}

export function DecisionScoreHero({
  title,
  category,
  summaryCopy,
  score,
  confidence,
  risk,
  profileCompleteness,
  bestMatchLabel,
}: {
  title: string;
  category?: string;
  summaryCopy: string;
  score: number;
  confidence: number;
  risk: string;
  profileCompleteness: number;
  bestMatchLabel: string;
}) {
  return (
    <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/[.07] to-accent/[.08] p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        {category ? <BadgePill label={category} tone="primary" /> : null}
        <BadgePill label="Best Match Based on Your Inputs" tone="success" />
      </div>
      <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-center">
        <div>
          <h1 className="text-balance text-3xl font-bold tracking-[-.04em] sm:text-5xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted sm:text-base">{summaryCopy}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <BadgePill label={`Recommended option: ${bestMatchLabel}`} tone="neutral" />
            <BadgePill label={`Match label: ${risk} risk`} tone={risk === "High" ? "danger" : risk === "Medium" ? "warning" : "success"} />
          </div>
        </div>
        <div className="grid place-items-center rounded-[1.75rem] border border-white/70 bg-white/85 p-4 shadow-soft">
          <ProgressRing value={score} size={132} tone="accent" />
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricChip icon={<Gauge size={15} />} label="Suitability score" value={`${score}/100`} />
        <MetricChip icon={<Sparkles size={15} />} label="Decision confidence" value={`${confidence}%`} />
        <MetricChip icon={<ShieldAlert size={15} />} label="Risk level" value={risk} />
        <MetricChip icon={<UserRound size={15} />} label="Profile completeness" value={`${profileCompleteness}%`} />
      </div>
    </Card>
  );
}

export function ConfidenceBadge({ value }: { value: number }) {
  return <BadgePill label={`Confidence ${value}%`} tone="success" />;
}

export function RiskBadge({ value }: { value: string }) {
  const tone = value.toLowerCase() === "high" ? "danger" : value.toLowerCase() === "medium" ? "warning" : "neutral";
  return <BadgePill label={`Risk ${value}`} tone={tone} />;
}

export function ProfileCompletenessBadge({ value }: { value: number }) {
  return <BadgePill label={`Profile ${value}%`} tone="primary" />;
}

export function ResultMetadataCard({
  completedAt,
  reviewSuggestion,
  risk,
  confidence,
  profileCompleteness,
  profileLabel,
}: {
  completedAt: string;
  reviewSuggestion: string;
  risk: string;
  confidence: number;
  profileCompleteness: number;
  profileLabel?: string;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Result metadata</p>
      <div className="mt-4 space-y-3 text-sm leading-6 text-muted">
        <MetaRow icon={<Clock3 size={15} />} label="Completed" value={completedAt} />
        <MetaRow icon={<Sparkles size={15} />} label="Confidence" value={`${confidence}%`} />
        <MetaRow icon={<ShieldAlert size={15} />} label="Risk" value={risk} />
        <MetaRow icon={<UserRound size={15} />} label="Profile" value={`${profileCompleteness}%${profileLabel ? ` · ${profileLabel}` : ""}`} />
      </div>
      <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/[.04] p-4">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Review suggestion</p>
        <p className="mt-2 text-sm leading-6 text-muted">{reviewSuggestion}</p>
      </div>
    </Card>
  );
}

function BadgePill({ label, tone }: { label: string; tone: "primary" | "success" | "warning" | "danger" | "neutral" }) {
  const styles = {
    primary: "border-primary/15 bg-primary/5 text-primary",
    success: "border-success/15 bg-success/10 text-success",
    warning: "border-amber-500/15 bg-amber-500/10 text-amber-700",
    danger: "border-rose-500/15 bg-rose-500/10 text-rose-700",
    neutral: "border-border bg-soft text-muted",
  }[tone];
  return <span className={`inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-bold ${styles}`}>{label}</span>;
}

function MetricChip({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-soft">
      <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.12em] text-muted">{icon}{label}</p>
      <p className="mt-2 text-lg font-bold text-ink">{value}</p>
    </div>
  );
}

function MetaRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-primary">{icon}</span>
      <div>
        <p className="text-xs font-bold uppercase tracking-[.12em] text-muted">{label}</p>
        <p className="text-sm font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}

function getRiskLabel(report: DecisionReport): string {
  const riskScore = Math.max(0, Math.min(100, report.score.value <= 0 ? 0 : 100 - Math.round(report.score.value)));
  if (riskScore >= 60) return "High";
  if (riskScore >= 35) return "Medium";
  return "Low";
}
