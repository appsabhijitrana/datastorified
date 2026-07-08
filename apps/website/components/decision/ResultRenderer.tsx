"use client";

import Link from "next/link";
import { Copy, Printer, Share2, BookmarkPlus, Trash2 } from "lucide-react";
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
      <ResultSectionLayout
        title="Decision summary"
        kicker={data.workflow.category ?? "Result overview"}
        description="A premium snapshot of the decision outcome with clear, educational language."
        aside={
          <div className="flex flex-wrap justify-start gap-2 lg:justify-end print:hidden">
            <Button variant="secondary" onClick={data.onCopy}><Copy size={16} />{data.copied ? "Copied" : "Copy summary"}</Button>
            <Button variant="secondary" onClick={data.onShare}><Share2 size={16} />Share</Button>
            <Button variant="secondary" onClick={data.onPrint}><Printer size={16} />Print</Button>
            <Button variant="secondary" onClick={() => data.onSave?.()}>{data.saved ? <><Trash2 size={16} /> Remove saved copy</> : <><BookmarkPlus size={16} /> Save locally</>}</Button>
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
    </main>
  );
}
