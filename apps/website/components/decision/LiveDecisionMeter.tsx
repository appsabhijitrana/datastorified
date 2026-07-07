"use client";

import { ChevronDown, ChevronUp, Gauge, Sparkles, Target, UserRound } from "lucide-react";
import { useState } from "react";
import { Card } from "@datastorified/ui";
import { ProgressBar } from "@datastorified/ui/design-system";
import type { DecisionOrchestratorPreview } from "@datastorified/decision-os/core/orchestrator";
import type { ProfileAnalysis } from "@datastorified/profile";

type LiveDecisionMeterProps = {
  preview: DecisionOrchestratorPreview;
  answerProgress: { answered: number; total: number };
  profileAnalysis?: Pick<ProfileAnalysis, "label" | "description" | "nextBestField" | "percentage">;
  collapsedByDefault?: boolean;
};

export function LiveDecisionMeter({ preview, answerProgress, profileAnalysis, collapsedByDefault = false }: LiveDecisionMeterProps) {
  const [collapsed, setCollapsed] = useState(collapsedByDefault);
  const enoughAnswers = answerProgress.answered >= 2;
  const leading = preview.rankedScores[0];
  const confidence = Math.round(leading?.confidence ?? preview.confidence ?? 0);
  const leadingLabel = enoughAnswers && leading ? leading.label : "Need more answers";
  const leadingScore = enoughAnswers && leading ? Math.round(leading.totalScore) : null;
  const factorCount = preview.rankedScores[0]?.factors.length ?? 0;
  const profileHint = profileAnalysis?.nextBestField?.label;

  return (
    <Card className="overflow-hidden rounded-[1.75rem] border-primary/15 bg-gradient-to-br from-primary/[.06] to-accent/[.08] p-4 shadow-soft">
      <button
        type="button"
        onClick={() => setCollapsed((current) => !current)}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={!collapsed}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-primary shadow-sm">
            <Gauge size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Live Decision Meter</p>
            <h2 className="mt-1 truncate text-lg font-bold">{leadingLabel}</h2>
          </div>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-white text-muted">
          {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </span>
      </button>

      {!collapsed && (
        <div className="mt-4 space-y-4">
          <CurrentMatchPreview
            value={enoughAnswers && leading ? leading.label : "Need more answers"}
            detail={enoughAnswers && leadingScore !== null ? `${leadingScore}/100 preview score` : "Answer a few more questions to surface the leading option."}
          />
          <ConfidencePreview value={`${confidence}%`} detail="This is a preview confidence, not the final result." />
          <div className="rounded-2xl border border-border bg-white/80 p-4">
            <ProgressBar value={Math.round((answerProgress.answered / Math.max(answerProgress.total, 1)) * 100)} label={`${answerProgress.answered} of ${answerProgress.total} answers`} />
          </div>
          <FactorsConsideredPreview value={`${factorCount} live factors`} detail="The meter reflects the active scoring factors in this workflow." />
          <ProfileImpactPreview
            value={profileHint ? `Improve with ${profileHint}` : "Optional profile hint"}
            detail={profileHint ? profileAnalysis?.description ?? "Add one detail to improve future previews." : "Add one profile detail to improve future previews."}
          />
          {profileAnalysis?.nextBestField && (
            <div className="rounded-2xl border border-primary/10 bg-primary/[.04] p-4 text-sm leading-6 text-muted">
              <p className="font-semibold text-ink">Optional profile improvement hint</p>
              <p className="mt-1">Next best field: <span className="text-primary">{profileAnalysis.nextBestField.label}</span>.</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function CurrentMatchPreview({ value, detail }: { value: string; detail: string }) {
  return <PreviewBlock title="Current match" icon={<Target size={16} />} value={value} detail={detail} />;
}

export function ConfidencePreview({ value, detail }: { value: string; detail: string }) {
  return <PreviewBlock title="Confidence preview" icon={<Sparkles size={16} />} value={value} detail={detail} />;
}

export function FactorsConsideredPreview({ value, detail }: { value: string; detail: string }) {
  return <PreviewBlock title="Factors considered" icon={<Gauge size={16} />} value={value} detail={detail} />;
}

export function ProfileImpactPreview({ value, detail }: { value: string; detail: string }) {
  return <PreviewBlock title="Profile impact" icon={<UserRound size={16} />} value={value} detail={detail} />;
}

function PreviewBlock({ title, icon, value, detail }: { title: string; icon: React.ReactNode; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white/85 p-4">
      <p className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[.14em] text-primary">{icon}{title}</p>
      <p className="mt-2 text-base font-bold">{value}</p>
      <p className="mt-1 text-sm leading-6 text-muted">{detail}</p>
    </div>
  );
}
