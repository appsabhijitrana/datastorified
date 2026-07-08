"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card } from "@datastorified/ui";
import { DecisionScenarioSimulator } from "./DecisionScenarioSimulator";
import { DecisionRetentionLoop } from "./DecisionRetentionLoop";
import { DecisionRelatedTools } from "./DecisionRelatedTools";
import { ActionPlanSection } from "./DecisionActionPlan";
import { ProfileCompletenessCard } from "../profile/ProfileCompletenessCard";
import { PersonalizedRecommendations } from "../personalization/PersonalizedRecommendations";
import { DecisionConfidenceCard, MissingSignalList, getDecisionConfidence } from "./DecisionConfidence";
import { ScoreBreakdownSection } from "./ScoreBreakdownSection";
import { TradeoffAnalysisSection } from "./TradeoffAnalysisSection";
import { ResultSectionLayout } from "./ResultSectionLayout";
import { adaptResultData, getResultAnswers, safeCopyForType } from "./ResultDataAdapter";
import type { ResultDataAdapterInput } from "./resultTypes";
import { ConfidenceBadge, DecisionSummary, ProfileCompletenessBadge, RiskBadge } from "./DecisionSummary";
import { CopySummaryButton, ExportReportButton, PrintReportButton, SaveReportButton, ShareReportSheet } from "./DecisionReportActions";

export function ResultRenderer(input: ResultDataAdapterInput) {
  const data = adaptResultData(input);
  const answers = getResultAnswers(data.report, data.answers);
  const [shareOpen, setShareOpen] = useState(false);
  const confidence = getDecisionConfidence({
    answerProgress: { answered: Object.keys(answers).length, total: data.workflow.questions.length, requiredAnswered: Object.keys(answers).length, requiredTotal: data.workflow.questions.length },
    profileAnalysis: data.profileAnalysis,
    decisionSignals: data.report.score.factors.length,
    assumptions: [],
  });
  const summary = data.safeSummary;

  return (
    <main className="mx-auto max-w-7xl overflow-x-hidden px-4 py-8 sm:px-6 sm:py-12">
      <ResultSectionLayout
        title="Decision summary"
        kicker={data.workflow.category ?? "Result overview"}
        description="A premium snapshot of the decision outcome with clear, educational language."
        aside={
          <div className="flex flex-wrap justify-start gap-2 lg:justify-end print:hidden">
            <CopySummaryButton summary={summary} onCopy={data.onCopy} />
            <Button variant="secondary" onClick={() => setShareOpen(true)}>Share</Button>
            <PrintReportButton onPrint={data.onPrint ?? (() => window.print())} />
            <SaveReportButton saved={Boolean(data.saved)} onToggleSave={() => data.onSave?.()} />
            <ExportReportButton report={data.report} workflow={data.workflow} summary={summary} disclaimerType={data.config.disclaimerType ?? "none"} />
          </div>
        }
      >
        <DecisionSummary
          workflowTitle={data.workflow.title}
          category={data.workflow.category}
          report={data.report}
          profileAnalysis={data.profileAnalysis}
          completedAt={data.report.generatedAt}
          bestMatchLabel={data.report.recommendation?.title ?? "the strongest option"}
          reviewSuggestion="Review the score breakdown, then revisit any factors that feel uncertain before you act."
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <ConfidenceBadge value={confidence.score} />
          <RiskBadge value={confidence.score >= 65 ? "Low" : confidence.score >= 40 ? "Medium" : "High"} />
          <ProfileCompletenessBadge value={data.profileAnalysis ? Math.round(data.profileAnalysis.percentage) : 0} />
        </div>
      </ResultSectionLayout>

      <ResultSectionLayout title="Confidence" kicker="Visible confidence" description="Confidence is a preview signal, not a guarantee." className="mt-8">
        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <DecisionConfidenceCard confidence={confidence} title="Result confidence" subtitle="This result confidence is based on answers, profile, and rule signals." />
          <MissingSignalList signals={confidence.missingSignals} />
        </div>
      </ResultSectionLayout>

      <ScoreBreakdownSection
        factors={data.report.score.factors}
        evidenceStrength={confidence.score}
        updatedAt={data.report.generatedAt}
      />

      <TradeoffAnalysisSection
        report={data.report}
        recommendation={data.report.recommendation}
        workflowTitle={data.workflow.title}
        category={data.workflow.category}
      />

      <ResultSectionLayout title="Scenario simulator" kicker="What if?" description="Adjust sensitive variables and compare the before/after result." className="mt-8">
        <DecisionScenarioSimulator workflow={data.workflow} answers={answers} baseReport={data.report} />
      </ResultSectionLayout>

      <ActionPlanSection
        workflow={data.workflow}
        report={data.report}
        disclaimerType={data.config.disclaimerType}
        onSaveChecklist={() => data.onSave?.()}
      />

      <ResultSectionLayout title="Review reminder" kicker="Next steps" description="Keep the decision moving without forcing extra onboarding." className="mt-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <PersonalizedRecommendations compact showProfile={false} />
          {data.profileAnalysis ? <ProfileCompletenessCard analysis={data.profileAnalysis} /> : <Card className="p-5"><p className="text-sm leading-6 text-muted">Anonymous usage is still supported. Sign in later to improve future decision previews.</p></Card>}
        </div>
      </ResultSectionLayout>

      <section className="mt-8 print:hidden">
        <DecisionRetentionLoop slug={data.workflow.slug} />
      </section>

      <section className="mt-8 print:hidden">
        <DecisionRelatedTools workflow={data.workflow} />
      </section>

      <Card className="mt-8 border-warning/20 bg-warning/[.06] p-5 text-sm leading-6 text-muted print:hidden">
        <strong className="text-ink">Important:</strong> {safeCopyForType(data.config.disclaimerType)}
      </Card>

      <div className="mt-8 flex justify-center gap-3 print:hidden">
        <Button variant="ghost" onClick={data.onRevisit}>Revisit answers</Button>
        <Link href="/decision/saved">
          <Button variant="ghost">Open saved decisions</Button>
        </Link>
      </div>

      <ShareReportSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        workflow={data.workflow}
        report={data.report}
        summary={summary}
        disclaimerType={data.config.disclaimerType ?? "none"}
        onCopySummary={() => { if (data.onCopy) void data.onCopy(); }}
        onCopyLink={async () => {
          await navigator.clipboard.writeText(window.location.href);
        }}
        onPrint={data.onPrint ?? (() => window.print())}
        onExport={() => {
          const blob = new Blob([buildPrintableHtml(data.workflow.title, summary, data.report, data.config.disclaimerType ?? "none")], { type: "text/html;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = `${data.workflow.slug}-report.html`;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        }}
      />
    </main>
  );
}

function buildPrintableHtml(title: string, summary: string, report: { generatedAt: string; score: { value: number; label?: string }; recommendation?: { title: string; summary: string }; actionPlan: string[]; }, disclaimerType: "none" | "finance" | "insurance" | "legal" | "health") {
  const disclaimer = safeCopyForType(disclaimerType);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${escapeHtml(title)} Report</title><style>body{font-family:Inter,system-ui,sans-serif;margin:40px;color:#0f172a}h1,h2{margin:0 0 12px}.meta,.muted{color:#64748b}.card{border:1px solid #e2e8f0;border-radius:18px;padding:16px;margin:16px 0}ul{margin:12px 0 0 20px}li{margin:8px 0;line-height:1.5}@media print{body{margin:20px}}</style></head><body><h1>${escapeHtml(title)}</h1><p class="meta">Generated ${new Date(report.generatedAt).toLocaleString("en-IN")}</p><div class="card"><h2>Summary</h2><p>${escapeHtml(summary).replace(/\n/g, "<br/>")}</p></div><div class="card"><h2>Score</h2><p><strong>${Math.round(report.score.value)}/100</strong> ${escapeHtml(report.score.label ?? "Decision profile")}</p></div><div class="card"><h2>Trade-offs</h2><ul>${(report.recommendation?.summary ? [report.recommendation.summary] : []).concat(report.actionPlan.slice(0, 3)).map((item) => `<li>${escapeHtml(item)}</li>`).join("") || "<li>Trade-off detail is limited for this workflow.</li>"}</ul></div><div class="card"><h2>Action checklist</h2><ul>${report.actionPlan.map((item) => `<li>${escapeHtml(item)}</li>`).join("") || "<li>Review assumptions before acting.</li>"}</ul></div><div class="card"><h2>Disclaimer</h2><p class="muted">${escapeHtml(disclaimer)}</p></div></body></html>`;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
