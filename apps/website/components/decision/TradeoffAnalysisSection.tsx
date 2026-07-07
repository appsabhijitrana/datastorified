"use client";

import type { ReactNode } from "react";
import { ArrowRightLeft, CheckCircle2, ShieldAlert, Sparkles, TriangleAlert } from "lucide-react";
import { Card } from "@datastorified/ui";
import type { DecisionRecommendation, DecisionReport } from "@datastorified/decision-os";
import { ResultSectionLayout } from "./ResultSectionLayout";

type TradeoffAnalysisSectionProps = {
  report: DecisionReport;
  recommendation?: DecisionRecommendation;
  workflowTitle: string;
  category?: string;
};

export function TradeoffAnalysisSection({ report, recommendation, workflowTitle, category }: TradeoffAnalysisSectionProps) {
  const gainItems = normalizeItems(
    recommendation?.actions.slice(0, 2),
    recommendation?.summary ? [recommendation.summary] : [],
    ["This option may fit the strongest signals in the current result."]
  );
  const compromiseItems = normalizeItems(
    report.risks.map((risk) => risk.description),
    recommendation?.actions.slice(2),
    ["Some details remain uncertain and should be verified before acting."]
  );
  const fitItems = normalizeItems(
    recommendation?.actions.slice(0, 1).map((action) => `May fit when ${action.toLowerCase()}.`),
    [category ? `Appears aligned for ${category.toLowerCase()} decisions when the current priorities match your inputs.` : "Appears aligned when the current inputs are the main decision drivers."],
    ["Consider verifying the remaining assumptions before acting."]
  );
  const reconsiderItems = normalizeItems(
    report.risks.length ? report.risks.map((risk) => `Consider verifying: ${risk.title}.`) : [],
    recommendation?.actions.slice(1).map((action) => `May need a different setup if ${action.toLowerCase()}.`),
    ["This result is less convincing if your priorities change materially."]
  );

  return (
    <ResultSectionLayout
      title="Trade-off analysis"
      kicker="What this result means"
      description="A structured view of the gains, compromises, fit, and caution points behind the current result."
      className="mt-8"
      aside={
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <ArrowRightLeft size={16} className="text-primary" />
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Workflow context</p>
          </div>
          <p className="mt-2 text-sm font-semibold text-ink">{workflowTitle}</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            {category ? `Category: ${category}.` : "Category context is not available."} Review the score breakdown for factor-level detail.
          </p>
        </Card>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <GainCard title="What you gain" items={gainItems} />
        <CompromiseCard title="What you trade off" items={compromiseItems} />
        <BestFitCard title="Who this fits" items={fitItems} />
        <ReconsiderCard title="Who should reconsider" items={reconsiderItems} />
      </div>

      {report.recommendation ? (
        <p className="mt-4 text-sm leading-6 text-muted">
          This analysis is derived from the current workflow output and may shift if the underlying answers or assumptions change.
        </p>
      ) : (
        <Card className="mt-4 border-border bg-soft/40 p-4">
          <p className="text-sm leading-6 text-muted">
            Trade-off detail is limited for this result, but the workflow still surfaces the current balance of gains and compromises. Consider verifying the missing inputs before relying on the outcome.
          </p>
        </Card>
      )}
    </ResultSectionLayout>
  );
}

export function GainCard({ title, items }: { title: string; items: string[] }) {
  return (
    <TradeoffCard
      tone="success"
      icon={<CheckCircle2 size={18} />}
      title={title}
      eyebrow="What you gain"
      items={items}
    />
  );
}

export function CompromiseCard({ title, items }: { title: string; items: string[] }) {
  return (
    <TradeoffCard
      tone="warning"
      icon={<Sparkles size={18} />}
      title={title}
      eyebrow="What you trade off"
      items={items}
    />
  );
}

export function BestFitCard({ title, items }: { title: string; items: string[] }) {
  return (
    <TradeoffCard
      tone="primary"
      icon={<ShieldAlert size={18} />}
      title={title}
      eyebrow="Who this fits"
      items={items}
    />
  );
}

export function ReconsiderCard({ title, items }: { title: string; items: string[] }) {
  return (
    <TradeoffCard
      tone="danger"
      icon={<TriangleAlert size={18} />}
      title={title}
      eyebrow="Who should reconsider"
      items={items}
    />
  );
}

function TradeoffCard({
  title,
  eyebrow,
  items,
  tone,
  icon,
}: {
  title: string;
  eyebrow: string;
  items: string[];
  tone: "primary" | "success" | "warning" | "danger";
  icon: ReactNode;
}) {
  const resolvedItems = items.length ? items : ["Details are limited for this workflow. Consider verifying the assumptions before acting."];
  return (
    <Card className="min-w-0 p-5">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl ${toneStyles[tone]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">{eyebrow}</p>
          <h3 className="mt-1 text-lg font-bold text-ink">{title}</h3>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {resolvedItems.slice(0, 4).map((item, index) => (
          <div key={`${title}:${index}`} className="rounded-2xl border border-border bg-soft/40 p-4">
            <p className="text-sm leading-6 text-muted">{ensureComplianceSafe(item, tone)}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function normalizeItems(primary?: string[], secondary: string[] = [], fallback: string[] = []): string[] {
  return [...(primary ?? []), ...secondary, ...fallback]
    .map((item) => item.trim())
    .filter(Boolean);
}

function ensureComplianceSafe(text: string, tone: "primary" | "success" | "warning" | "danger"): string {
  const safe = text
    .replace(/\bmust\b/giu, "may")
    .replace(/\bshould invest\b/giu, "may fit")
    .replace(/\bguaranteed\b/giu, "not guaranteed")
    .replace(/\brecommend(?:ed|s)?\b/giu, "appears aligned");
  if (tone === "danger" && !/consider verifying|may fit|appears aligned/i.test(safe)) {
    return `${safe} Consider verifying the assumptions before proceeding.`;
  }
  if (tone === "primary" && !/may fit|appears aligned/i.test(safe)) {
    return `${safe} This may fit the current profile of inputs.`;
  }
  return safe;
}

const toneStyles: Record<"primary" | "success" | "warning" | "danger", string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-amber-500/10 text-amber-700",
  danger: "bg-danger/10 text-danger",
};
