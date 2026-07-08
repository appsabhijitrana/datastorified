"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card } from "@datastorified/ui";
import { BarComparisonChart, ConfidenceMeter, FactorScoreBar, KPITrendIndicator, MiniLineChart, ProgressRing, RiskMeter, ScenarioProjectionChart } from "@datastorified/ui/library";
import { DecisionScenarioSimulator } from "./DecisionScenarioSimulator";
import { RelatedDecisionJourney } from "./DecisionRetentionLoop";
import { DecisionRelatedTools } from "./DecisionRelatedTools";
import { ActionPlanSection } from "./DecisionActionPlan";
import { ProfileCompletenessCard } from "../profile/ProfileCompletenessCard";
import { DecisionConfidenceCard, getDecisionConfidence } from "./DecisionConfidence";
import { ScoreBreakdownSection } from "./ScoreBreakdownSection";
import { TradeoffAnalysisSection } from "./TradeoffAnalysisSection";
import { ReviewReminderCard, SetReviewReminderSheet, useDecisionReviewReminder } from "./DecisionReviewReminder";
import { ResultSectionLayout } from "./ResultSectionLayout";
import { adaptResultData, getResultAnswers, safeCopyForType } from "./ResultDataAdapter";
import type { ResultDataAdapterInput } from "./resultTypes";
import { ConfidenceBadge, DecisionSummary, ProfileCompletenessBadge, RiskBadge } from "./DecisionSummary";
import { CopySummaryButton, ExportReportButton, PrintReportButton, SaveReportButton, ShareReportSheet } from "./DecisionReportActions";
import { DecisionScoreCard } from "./DecisionScoreCard";

export function ResultRenderer(input: ResultDataAdapterInput) {
  const data = adaptResultData(input);
  const answers = getResultAnswers(data.report, data.answers);
  const [shareOpen, setShareOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const { reminder, refresh } = useDecisionReviewReminder(data.workflow.id);
  const confidence = getDecisionConfidence({
    answerProgress: { answered: Object.keys(answers).length, total: data.workflow.questions.length, requiredAnswered: Object.keys(answers).length, requiredTotal: data.workflow.questions.length },
    profileAnalysis: data.profileAnalysis,
    decisionSignals: data.report.score.factors.length,
    assumptions: [],
  });
  const summary = data.safeSummary;
  const comparisonPair = data.report.score.factors.slice(0, 2);
  const comparisonLeft = Math.round(comparisonPair[0]?.score ?? data.report.score.value);
  const comparisonRight = Math.round(comparisonPair[1]?.score ?? Math.max(0, 100 - data.report.score.value));
  const scenarioData = buildScenarioSeries(data.report.score.value, confidence.score);

  return (
    <main className="mx-auto max-w-7xl overflow-x-hidden px-4 py-8 sm:px-6 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          <section className="space-y-4">
            <ResultSectionLayout
              title="Result summary"
              kicker={data.workflow.category ?? "Premium analytics"}
              description="A modern decision dashboard that keeps the engine intact while showing the outcome more clearly."
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
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Comparison summary</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight">FD score vs SIP score</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">A compact summary of how the leading options compare, based on the factors and weights already computed by the engine.</p>
                </div>
                <ProgressRing value={Math.round(data.report.score.value)} label="Score" size={104} tone="accent" />
              </div>
              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <div className="space-y-4">
                  <BarComparisonChart
                    title="Headline comparison"
                    leftLabel={comparisonPair[0]?.label ?? "Leading option"}
                    rightLabel={comparisonPair[1]?.label ?? "Alternative"}
                    leftValue={comparisonLeft}
                    rightValue={comparisonRight}
                  />
                </div>
                <div className="space-y-4">
                  <Card className="p-5">
                    <p className="text-sm font-semibold text-muted">Key score signals</p>
                    <div className="mt-4 space-y-4">
                      {data.report.score.factors.slice(0, 4).map((factor) => (
                        <FactorScoreBar
                          key={factor.factorId}
                          label={factor.label}
                          value={Math.round(factor.score)}
                          hint={factor.weight >= 0.3 ? "High-importance factor" : factor.weight >= 0.15 ? "Medium-importance factor" : "Lower-importance factor"}
                          tone={factor.score >= 65 ? "success" : factor.score >= 40 ? "warning" : "danger"}
                        />
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Live signals</p>
              <div className="mt-4 space-y-4">
                <KPITrendIndicator label="Suitability score" value={`${Math.round(data.report.score.value)}/100`} delta={`${data.report.score.label ?? "Decision profile"}`} tone="primary" />
                <KPITrendIndicator label="Decision confidence" value={`${confidence.score}%`} delta={`${confidence.confidenceBand}`} tone="success" />
                <KPITrendIndicator label="Risk level" value={confidence.score >= 65 ? "Low" : confidence.score >= 40 ? "Medium" : "High"} delta={`Profile ${data.profileAnalysis ? Math.round(data.profileAnalysis.percentage) : 0}%`} tone={confidence.score >= 65 ? "success" : confidence.score >= 40 ? "warning" : "danger"} />
              </div>
              <div className="mt-5">
                <RiskMeter value={confidence.score >= 65 ? 28 : confidence.score >= 40 ? 52 : 74} hint="Risk reflects the current recommendation preview, not a final recommendation." />
              </div>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Visual analytics</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">Projection, confidence, and scenario preview</h2>
              <p className="mt-2 text-sm leading-6 text-muted">Use the chart and preview cards to understand how the result behaves when assumptions move.</p>
              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <ScenarioProjectionChart
                  title="Projection line chart"
                  description="A lightweight trend view of how the current result compares with a confidence trajectory."
                  data={scenarioData}
                />
                <div className="space-y-4">
                  <ConfidenceMeter value={confidence.score} hint="Based on answer completion, visible signals, and profile support." />
                  <DecisionScoreCard score={data.report.score} compact />
                </div>
              </div>
              <div className="mt-4">
                <MiniLineChart points={scenarioData.map((point) => point.value)} />
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">AI insights</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">Why this result happened</h2>
              <div className="mt-4 space-y-3">
                <InsightTile title="Why this recommendation" body={data.report.recommendation?.summary ?? "This option achieved the highest current suitability score."} />
                <InsightTile title="What can change this decision" body="Changing the assumptions, profile details, or answer balance may change the preview and the final report." />
                <InsightTile title="Risks" body={data.report.risks[0]?.description ?? "The workflow still has open trade-offs to verify before acting."} />
                <InsightTile title="Alternatives" body={data.report.recommendation?.actions?.[0] ?? "Review the closest alternative and compare the strongest factors again."} />
              </div>
            </Card>
          </section>

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

          <section className="space-y-4">
            <ResultSectionLayout title="Scenario simulator" kicker="What if?" description="Adjust sensitive variables and compare the before/after result." className="mt-0">
              <DecisionScenarioSimulator workflow={data.workflow} answers={answers} baseReport={data.report} />
            </ResultSectionLayout>
          </section>

          <ActionPlanSection
            workflow={data.workflow}
            report={data.report}
            disclaimerType={data.config.disclaimerType}
            onSaveChecklist={() => data.onSave?.()}
          />

          <section className="space-y-4">
            <ResultSectionLayout title="Related decisions" kicker="Keep exploring" description="A retention loop that keeps the decision momentum going." className="mt-0">
              <RelatedDecisionJourney slug={data.workflow.slug} />
            </ResultSectionLayout>
          </section>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24">
          <DecisionConfidenceCard confidence={confidence} title="Live confidence" subtitle="This is a preview signal, not a final recommendation." />
          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Decision profile</p>
            <div className="mt-4 space-y-4">
              <DecisionScoreCard score={data.report.score} compact />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <ConfidenceBadge value={confidence.score} />
                <RiskBadge value={confidence.score >= 65 ? "Low" : confidence.score >= 40 ? "Medium" : "High"} />
                <ProfileCompletenessBadge value={data.profileAnalysis ? Math.round(data.profileAnalysis.percentage) : 0} />
              </div>
            </div>
          </Card>
          <ReviewReminderCard
            workflowId={data.workflow.id}
            title={data.workflow.title}
            nextReviewAt={reminder?.nextReviewAt}
            reason={reminder?.reason}
            onOpenSheet={() => setReviewOpen(true)}
          />
          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">What can change this decision?</p>
            <div className="mt-3 space-y-3 text-sm leading-6 text-muted">
              <p>Answer completion and factor balance can change the preview.</p>
              <p>Profile updates can sharpen confidence and recommendation context.</p>
              <p>Scenario changes can shift the score and trade-offs.</p>
            </div>
          </Card>
          {data.profileAnalysis ? (
            <ProfileCompletenessCard analysis={data.profileAnalysis} />
          ) : (
            <Card className="p-5">
              <p className="text-sm leading-6 text-muted">Anonymous usage is still supported. Sign in later to improve future decision previews.</p>
            </Card>
          )}
          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Actions</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setShareOpen(true)}>Share</Button>
              <Button variant="secondary" onClick={data.onPrint ?? (() => window.print())}>Print</Button>
              <Button variant="secondary" onClick={() => data.onSave?.()}>{data.saved ? "Saved" : "Save"}</Button>
            </div>
          </Card>
          <DecisionRelatedTools workflow={data.workflow} />
        </aside>
      </div>

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

      <SetReviewReminderSheet
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        workflowId={data.workflow.id}
        title={data.workflow.title}
        onSaved={() => refresh()}
      />
    </main>
  );
}

function InsightTile({ title, body }: { title: string; body: string }) {
  return (
    <Card className="border-primary/15 bg-gradient-to-br from-primary/[.04] to-accent/[.06] p-4">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
    </Card>
  );
}

function buildScenarioSeries(score: number, confidence: number) {
  const base = Math.max(0, Math.min(100, Math.round(score)));
  const confidenceBand = Math.max(0, Math.min(100, Math.round(confidence)));
  return [
    { label: "Now", value: Math.max(10, base - 8) },
    { label: "1x", value: base },
    { label: "2x", value: Math.min(100, base + 5) },
    { label: "3x", value: Math.min(100, base + 10) },
    { label: "Conf", value: confidenceBand },
    { label: "Future", value: Math.min(100, Math.round((base + confidenceBand) / 2)) },
  ];
}

function buildPrintableHtml(title: string, summary: string, report: { generatedAt: string; score: { value: number; label?: string }; recommendation?: { title: string; summary: string }; actionPlan: string[]; }, disclaimerType: "none" | "finance" | "insurance" | "legal" | "health") {
  const disclaimer = safeCopyForType(disclaimerType);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${escapeHtml(title)} Report</title><style>body{font-family:Inter,system-ui,sans-serif;margin:40px;color:#0f172a}h1,h2{margin:0 0 12px}.meta,.muted{color:#64748b}.card{border:1px solid #e2e8f0;border-radius:18px;padding:16px;margin:16px 0}ul{margin:12px 0 0 20px}li{margin:8px 0;line-height:1.5}@media print{body{margin:20px}}</style></head><body><h1>${escapeHtml(title)}</h1><p class="meta">Generated ${new Date(report.generatedAt).toLocaleString("en-IN")}</p><div class="card"><h2>Summary</h2><p>${escapeHtml(summary).replace(/\n/g, "<br/>")}</p></div><div class="card"><h2>Score</h2><p><strong>${Math.round(report.score.value)}/100</strong> ${escapeHtml(report.score.label ?? "Decision profile")}</p></div><div class="card"><h2>Trade-offs</h2><ul>${(report.recommendation?.summary ? [report.recommendation.summary] : []).concat(report.actionPlan.slice(0, 3)).map((item) => `<li>${escapeHtml(item)}</li>`).join("") || "<li>Trade-off detail is limited for this workflow.</li>"}</ul></div><div class="card"><h2>Action checklist</h2><ul>${report.actionPlan.map((item) => `<li>${escapeHtml(item)}</li>`).join("") || "<li>Review assumptions before acting.</li>"}</ul></div><div class="card"><h2>Disclaimer</h2><p class="muted">${escapeHtml(disclaimer)}</p></div></body></html>`;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
