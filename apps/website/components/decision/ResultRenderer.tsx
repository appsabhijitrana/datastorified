"use client";

import Link from "next/link";
import { Copy, Printer, Share2, BookmarkPlus, Trash2 } from "lucide-react";
import { Badge, Button, Card } from "@datastorified/ui";
import { DecisionScoreCard } from "./DecisionScoreCard";
import { DecisionRecommendation } from "./DecisionRecommendation";
import { DecisionActionPlan } from "./DecisionActionPlan";
import { DecisionScenarioSimulator } from "./DecisionScenarioSimulator";
import { DecisionRetentionLoop } from "./DecisionRetentionLoop";
import { DecisionRelatedTools } from "./DecisionRelatedTools";
import { DecisionFactorCard } from "./DecisionFactorCard";
import { DecisionRiskCard } from "./DecisionRiskCard";
import { ProfileCompletenessCard } from "../profile/ProfileCompletenessCard";
import { PersonalizedRecommendations } from "../personalization/PersonalizedRecommendations";
import { DecisionConfidenceCard, MissingSignalList, getDecisionConfidence } from "./DecisionConfidence";
import { ResultSectionLayout } from "./ResultSectionLayout";
import { adaptResultData, getResultAnswers, safeCopyForType } from "./ResultDataAdapter";
import type { ResultDataAdapterInput } from "./resultTypes";

export function ResultRenderer(input: ResultDataAdapterInput) {
  const data = adaptResultData(input);
  const answers = getResultAnswers(data.report, data.answers);
  const confidence = getDecisionConfidence({
    answerProgress: { answered: Object.keys(answers).length, total: data.workflow.questions.length, requiredAnswered: Object.keys(answers).length, requiredTotal: data.workflow.questions.length },
    profileAnalysis: data.profileAnalysis,
    decisionSignals: data.report.score.factors.length,
    assumptions: [],
  });

  return (
    <main className="mx-auto max-w-7xl overflow-x-hidden px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{data.workflow.category ?? data.workflow.pluginId} result</Badge>
            {data.profileAnalysis ? <Badge className="border-success/15 bg-success/10 text-success">{data.profileAnalysis.label}</Badge> : null}
          </div>
          <h1 className="mt-4 text-balance text-3xl font-bold tracking-[-.035em] sm:text-5xl">{data.workflow.title}</h1>
          <p className="mt-2 text-sm text-muted">Created {new Date(data.report.generatedAt).toLocaleString("en-IN")}</p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant="secondary" onClick={data.onCopy}><Copy size={16} />{data.copied ? "Copied" : "Copy summary"}</Button>
          <Button variant="secondary" onClick={data.onShare}><Share2 size={16} />Share</Button>
          <Button variant="secondary" onClick={data.onPrint}><Printer size={16} />Print</Button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 print:hidden">
        {data.saved ? (
          <Button variant="secondary" onClick={() => data.onSave?.()}><Trash2 size={16} /> Remove saved copy</Button>
        ) : (
          <Button variant="secondary" onClick={() => data.onSave?.()}><BookmarkPlus size={16} /> Save locally</Button>
        )}
      </div>

      <ResultSectionLayout title="Summary" kicker="Result overview" description="A concise summary of the current result with clear next steps.">
        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <DecisionScoreCard score={data.report.score} />
          <Card className="p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Summary</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted">{data.safeSummary}</p>
            <div className="mt-5">
              {data.report.recommendation ? (
                <DecisionRecommendation recommendation={data.report.recommendation} analysis={data.profileAnalysis} />
              ) : (
                <p className="text-sm leading-6 text-muted">A recommendation is not available for this result yet.</p>
              )}
            </div>
          </Card>
        </div>
      </ResultSectionLayout>

      <ResultSectionLayout title="Confidence" kicker="Visible confidence" description="Confidence is a preview signal, not a guarantee." className="mt-8">
        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <DecisionConfidenceCard confidence={confidence} title="Result confidence" subtitle="This result confidence is based on answers, profile, and rule signals." />
          <MissingSignalList signals={confidence.missingSignals} />
        </div>
      </ResultSectionLayout>

      <ResultSectionLayout title="Score breakdown" kicker="Why this score" description="Each factor combines answers with published rules and weights." className="mt-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.report.score.factors.map((factor) => <DecisionFactorCard key={factor.factorId} factor={factor} />)}
        </div>
      </ResultSectionLayout>

      <ResultSectionLayout title="Trade-offs" kicker="What to watch" description="Risk checks and trade-off context stay visible for review." className="mt-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="min-w-0">
            <div className="space-y-3">
              {data.report.risks.length ? data.report.risks.map((risk) => <DecisionRiskCard key={`${risk.id}:${risk.sourceRuleId}`} risk={risk} />) : <DecisionRiskCard />}
            </div>
          </div>
          <DecisionActionPlan items={data.report.actionPlan} />
        </div>
      </ResultSectionLayout>

      <ResultSectionLayout title="Scenario simulator" kicker="What if?" description="Adjust sensitive variables and compare the before/after result." className="mt-8">
        <DecisionScenarioSimulator workflow={data.workflow} answers={answers} baseReport={data.report} />
      </ResultSectionLayout>

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
    </main>
  );
}
