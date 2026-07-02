"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookmarkPlus, Copy, Printer, Share2, Trash2 } from "lucide-react";
import { Badge, Button, Card } from "@datastorified/ui";
import { buildDecisionReport, decisionPluginRegistry } from "@datastorified/decision-os";
import { buildProfileAwareRecommendation, getProfileAnalysis, type DecisionProfileEnvelope } from "@datastorified/profile";
import { getDecisionAdapters } from "@datastorified/decision-os/adapters";
import { authClient } from "@datastorified/auth";
import { HybridDecisionRepository } from "@datastorified/decision-repository";
import type { DecisionRepositoryDecision } from "@datastorified/decision-repository";
import { DecisionAccuracyBadge } from "./DecisionAccuracyBadge";
import { DecisionActionPlan } from "./DecisionActionPlan";
import { DecisionEmptyState } from "./DecisionEmptyState";
import { DecisionFactorCard } from "./DecisionFactorCard";
import { DecisionRecommendation } from "./DecisionRecommendation";
import { DecisionRelatedTools } from "./DecisionRelatedTools";
import { DecisionReportView } from "./DecisionReportView";
import { DecisionRiskCard } from "./DecisionRiskCard";
import { DecisionScenarioSimulator } from "./DecisionScenarioSimulator";
import { DecisionScoreCard } from "./DecisionScoreCard";
import { PersonalizedRecommendations } from "../personalization/PersonalizedRecommendations";
import { ImproveAnalysisCTA } from "../profile/ImproveAnalysisCTA";
import { ProfileCompletenessCard } from "../profile/ProfileCompletenessCard";

export function DecisionResultPage({ id }: { id: string }) {
  const router = useRouter();
  const adapters = getDecisionAdapters();
  const { data: session } = authClient.useSession();
  const repository = useMemo(() => new HybridDecisionRepository({ authenticated: Boolean(session?.user) }), [session?.user]);
  const [item, setItem] = useState<DecisionRepositoryDecision | null | undefined>(undefined);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState<DecisionProfileEnvelope | null>(null);
  useEffect(() => {
    void repository.getDecision(id).then((decision) => {
      setItem(decision ?? null);
      setSaved(Boolean(decision));
    });
  }, [id, repository]);
  useEffect(() => {
    void adapters.profile.getProfile().then(setProfile);
  }, [adapters.profile]);
  const workflow = item ? decisionPluginRegistry.getWorkflow(item.workflowId) : undefined;
  const report = useMemo(() => item && workflow ? item.report ?? buildDecisionReport(workflow, item.answers, { generatedAt: item.updatedAt }) : undefined, [item, workflow]);
  const profileAnalysis = useMemo(() => getProfileAnalysis(profile?.profile), [profile]);
  const profileRecommendation = useMemo(() => report?.recommendation ? buildProfileAwareRecommendation(report.recommendation, profile) : undefined, [profile, report?.recommendation]);
  if (item === undefined) return <main className="px-4 py-24"><div className="mx-auto h-40 max-w-xl animate-pulse rounded-3xl bg-soft" /></main>;
  if (!item || !workflow || !report) return <main className="px-4 py-24"><DecisionEmptyState /></main>;

  const summary = `${workflow.title}\nScore: ${Math.round(report.score.value)}/100 — ${report.score.label ?? "Decision profile"}\nRecommendation: ${report.recommendation?.title ?? "Review the result"}\n${report.recommendation?.summary ?? ""}\nNext: ${report.actionPlan[0] ?? "Review assumptions"}`;
  const copy = async () => { await navigator.clipboard.writeText(summary); setCopied(true); window.setTimeout(() => setCopied(false), 1200); };
  const share = async () => { if (navigator.share) await navigator.share({ title: workflow.title, text: summary, url: window.location.href }); else await copy(); };
  const saveLocally = async () => {
    await repository.saveDecision({
      ...item,
      workflow,
      plugin: decisionPluginRegistry.getPlugin(workflow.pluginId) ?? item.plugin,
      report,
      question: item.question ?? workflow.title,
      score: item.score,
      confidence: item.confidence,
      riskLevel: item.riskLevel,
      recommendation: item.recommendation,
      actionPlan: item.actionPlan,
      assumptions: item.assumptions,
    });
    setSaved(true);
  };
  const deleteSaved = async () => { await repository.deleteDecision(item.id); setSaved(false); };

  return <main className="mx-auto max-w-7xl overflow-x-hidden px-4 py-8 sm:px-6 sm:py-12"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge>{workflow.category ?? workflow.pluginId} result</Badge><DecisionAccuracyBadge analysis={profileAnalysis} /></div><h1 className="mt-4 text-balance text-3xl font-bold tracking-[-.035em] sm:text-5xl">{workflow.title}</h1><p className="mt-2 text-sm text-muted">Created {new Date(item.createdAt).toLocaleString("en-IN")}</p></div><div className="flex flex-wrap gap-2 print:hidden"><Button variant="secondary" onClick={copy}><Copy size={16} />{copied ? "Copied" : "Copy summary"}</Button><Button variant="secondary" onClick={share}><Share2 size={16} />Share</Button><Button variant="secondary" onClick={() => window.print()}><Printer size={16} />Print</Button></div></div>
    <div className="mt-6 flex flex-wrap gap-2 print:hidden">
      {saved ? (
        <Button variant="secondary" onClick={deleteSaved}><Trash2 size={16} /> Remove saved copy</Button>
      ) : (
        <Button variant="secondary" onClick={saveLocally}><BookmarkPlus size={16} /> Save locally</Button>
      )}
    </div>
    <div className="mt-8 hidden print:block"><DecisionReportView report={report} workflow={workflow} /></div>
    <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[360px_minmax(0,1fr)] print:hidden"><DecisionScoreCard score={report.score} />{profileRecommendation && <DecisionRecommendation recommendation={profileRecommendation.recommendation} analysis={profileRecommendation.analysis} note={profileRecommendation.analysisNote} />}</div>
    <section className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[360px_minmax(0,1fr)] print:hidden">
      <ProfileCompletenessCard analysis={profileAnalysis} />
      <ImproveAnalysisCTA />
    </section>
    <section className="mt-8 print:hidden"><h2 className="text-2xl font-bold">Why this score</h2><p className="mt-2 text-sm text-muted">Each factor combines your answers with the workflow’s published rules and weights.</p><div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">{report.score.factors.map((factor) => <DecisionFactorCard key={factor.factorId} factor={factor} />)}</div></section>
    <section className="mt-8 grid min-w-0 gap-6 lg:grid-cols-2 print:hidden"><div className="min-w-0"><h2 className="mb-4 text-2xl font-bold">Risk checks</h2><div className="space-y-3">{report.risks.length ? report.risks.map((risk) => <DecisionRiskCard key={`${risk.id}:${risk.sourceRuleId}`} risk={risk} />) : <DecisionRiskCard />}</div></div><DecisionActionPlan items={report.actionPlan} /></section>
    <section className="mt-8 print:hidden"><PersonalizedRecommendations compact showProfile={false} /></section>
    <section className="mt-8 print:hidden"><DecisionScenarioSimulator workflow={workflow} answers={item.answers} baseReport={report} /></section>
    <section className="mt-8 print:hidden"><DecisionRelatedTools workflow={workflow} /></section>
    <Card className="mt-8 border-warning/20 bg-warning/[.06] p-5 text-sm leading-6 text-muted print:hidden"><strong className="text-ink">Important:</strong> This is a structured educational aid, not financial, investment, legal, career, or other professional advice. Verify current rates, terms, laws, and material assumptions independently.</Card>
    <div className="mt-8 flex justify-center gap-3 print:hidden"><Button variant="ghost" onClick={() => router.push(`/decision/${workflow.pluginId}/${workflow.slug}`)}>Revisit answers</Button><Button variant="ghost" onClick={() => router.push("/decision/saved")}>Open saved decisions</Button></div>
  </main>;
}
