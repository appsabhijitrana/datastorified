"use client";

import { Clock3, Info, Sparkles } from "lucide-react";
import { Card } from "@datastorified/ui";
import type { DecisionFactorScore, DecisionOptionScore } from "@datastorified/decision-os";
import { ResultSectionLayout } from "./ResultSectionLayout";

export function ScoreBreakdownSection({
  factors,
  options = [],
  evidenceStrength = 0,
  updatedAt,
}: {
  factors: DecisionFactorScore[];
  options?: DecisionOptionScore[];
  evidenceStrength?: number;
  updatedAt?: string;
}) {
  const sorted = [...factors].sort((left, right) => (right.contribution ?? 0) - (left.contribution ?? 0));
  return (
    <ResultSectionLayout
      title="Score breakdown"
      kicker="Why this result happened"
      description="Each factor shows how the options compared, what carried the most weight, and what influenced the score."
      aside={
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <EvidenceStrengthCard value={evidenceStrength} />
          <DataFreshnessBadge updatedAt={updatedAt} />
        </div>
      }
      className="mt-8"
    >
      {sorted.length ? (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {sorted.map((factor) => (
            <FactorScoreCard key={factor.factorId} factor={factor} options={options} />
          ))}
        </div>
      ) : (
        <Card className="p-5">
          <p className="text-sm leading-6 text-muted">Factor-level detail is not available for this result yet. The overall score still reflects the current workflow rules and weights.</p>
        </Card>
      )}
    </ResultSectionLayout>
  );
}

export function FactorScoreCard({ factor, options }: { factor: DecisionFactorScore; options: DecisionOptionScore[] }) {
  const tone = factor.score >= 65 ? "success" : factor.score >= 40 ? "warning" : "danger";
  return (
    <Card className="min-w-0 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Factor</p>
          <h3 className="mt-1 text-lg font-bold">{prettyLabel(factor.label)}</h3>
        </div>
        <span className={`inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-bold ${badgeToneClass(tone)}`}>
          {importanceLabel(factor.weight)}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-muted">This factor contributes to the current score using the workflow’s published rules and weights.</p>

      <div className="mt-4 space-y-3">
        {options.length ? options.map((option) => (
          <div key={option.optionId} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-ink">{option.label}</span>
              <span className="text-muted">{Math.round(resolveOptionScore(option, factor))}</span>
            </div>
            <FactorComparisonBar value={resolveOptionScore(option, factor)} max={100} tone={option.optionId === options[0]?.optionId ? "primary" : "muted"} />
          </div>
        )) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-ink">Current result</span>
              <span className="text-muted">{Math.round(factor.score)}</span>
            </div>
            <FactorComparisonBar value={factor.score} max={100} tone={tone} />
          </div>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-soft/40 p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-muted">
          <Info size={14} />
          What influenced the score
        </div>
        <p className="mt-2 text-sm leading-6 text-muted">
          The workflow combined your current answers with the factor’s weight and supporting rules.
        </p>
      </div>
    </Card>
  );
}

export function FactorComparisonBar({ value, max = 100, tone = "primary" }: { value: number; max?: number; tone?: "primary" | "muted" | "success" | "warning" | "danger" }) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  const barClass = {
    primary: "from-primary to-accent",
    muted: "from-border to-border/70",
    success: "from-success to-emerald-500",
    warning: "from-amber-500 to-amber-400",
    danger: "from-danger to-rose-500",
  }[tone];
  return (
    <div className="h-2 overflow-hidden rounded-full bg-soft">
      <div className={`h-full rounded-full bg-gradient-to-r ${barClass}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

export function EvidenceStrengthCard({ value }: { value: number }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-primary" />
        <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Evidence strength</p>
      </div>
      <p className="mt-2 text-2xl font-bold">{Math.round(value)}%</p>
      <p className="mt-1 text-sm leading-6 text-muted">How much factor-level evidence is visible in this result.</p>
    </Card>
  );
}

export function DataFreshnessBadge({ updatedAt }: { updatedAt?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <Clock3 size={16} className="text-primary" />
        <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Data freshness</p>
      </div>
      <p className="mt-2 text-sm font-semibold text-ink">{updatedAt ? new Date(updatedAt).toLocaleString("en-IN") : "Current result snapshot"}</p>
      <p className="mt-1 text-sm leading-6 text-muted">The score breakdown uses the latest saved result snapshot available on this device or account.</p>
    </Card>
  );
}

function resolveOptionScore(option: DecisionOptionScore, factor: DecisionFactorScore): number {
  const match = option.factors.find((entry) => entry.factorId === factor.factorId || entry.label === factor.label);
  return typeof match?.contribution === "number" ? match.contribution : factor.score;
}

function importanceLabel(weight: number): string {
  if (weight >= 0.3) return "High importance";
  if (weight >= 0.15) return "Medium importance";
  return "Low importance";
}

function prettyLabel(label: string): string {
  return label
    .replace(/[_-]/gu, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function badgeToneClass(tone: "success" | "warning" | "danger") {
  return {
    success: "border-success/15 bg-success/10 text-success",
    warning: "border-amber-500/15 bg-amber-500/10 text-amber-700",
    danger: "border-rose-500/15 bg-rose-500/10 text-rose-700",
  }[tone];
}
