"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, RotateCcw, ShieldCheck } from "lucide-react";
import { Badge, Button, Card } from "@datastorified/ui";
import {
  buildDecisionFacts,
  buildDecisionReport,
  createDecisionId,
  createDefaultAnswers,
  decisionPluginRegistry,
  getVisibleQuestions,
  validateAnswers,
  type DecisionAnswers,
  type DecisionValue,
} from "@datastorified/decision-os";
import { getProfileAnalysis, type DecisionProfileEnvelope } from "@datastorified/profile";
import { getDecisionAdapters } from "@datastorified/decision-os/adapters";
import { authClient } from "@datastorified/auth";
import { HybridDecisionRepository, buildDecisionRecord } from "@datastorified/decision-repository";
import { DecisionAccuracyBadge } from "./DecisionAccuracyBadge";
import { DecisionProgress } from "./DecisionProgress";
import { DecisionQuestion } from "./DecisionQuestion";
import { DecisionScoreCard } from "./DecisionScoreCard";

export function DecisionFlow({ pluginId, slug }: { pluginId: string; slug: string }) {
  const workflow = decisionPluginRegistry.getWorkflowBySlug(slug);
  if (!workflow || workflow.pluginId !== pluginId) throw new Error(`Unknown Decision OS workflow: ${pluginId}/${slug}`);
  const router = useRouter();
  const adapters = getDecisionAdapters();
  const { data: session } = authClient.useSession();
  const repository = useMemo(() => new HybridDecisionRepository({ authenticated: Boolean(session?.user) }), [session?.user]);
  const [profile, setProfile] = useState<DecisionProfileEnvelope | null>(null);
  const [answers, setAnswers] = useState<DecisionAnswers>(() => createDefaultAnswers(workflow.questions));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const facts = useMemo(() => buildDecisionFacts(workflow, answers), [answers, workflow]);
  const questions = useMemo(() => getVisibleQuestions(workflow.questions, answers, facts), [answers, facts, workflow.questions]);
  const report = useMemo(() => buildDecisionReport(workflow, answers), [answers, workflow]);
  const profileAnalysis = useMemo(() => getProfileAnalysis(profile?.profile), [profile]);
  const currentQuestion = questions[Math.min(step, Math.max(0, questions.length - 1))];
  const progress = questions.length ? ((Math.min(step, questions.length - 1) + 1) / questions.length) * 100 : 100;

  useEffect(() => {
    void adapters.profile.getProfile().then(setProfile);
  }, [adapters.profile]);
  useEffect(() => {
    void adapters.memory.getDraft(workflow.id).then((savedDraft) => {
      if (!savedDraft) return;
      setAnswers((current) => ({ ...current, ...savedDraft.answers }));
      setStep(typeof savedDraft.currentStep === "number" ? savedDraft.currentStep : typeof savedDraft.step === "number" ? savedDraft.step : 0);
    });
  }, [adapters.memory, workflow.id]);
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void adapters.memory.saveDraft({ workflowId: workflow.id, pluginId: workflow.pluginId, slug, answers, currentStep: step, updatedAt: new Date().toISOString() });
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [adapters.memory, answers, step, slug, workflow.id, workflow.pluginId]);
  useEffect(() => {
    void adapters.memory.saveProfile({ lastOpenedWorkflow: { workflowId: workflow.id, pluginId: workflow.pluginId, slug, openedAt: new Date().toISOString() } });
  }, [adapters.memory, workflow.id, workflow.pluginId, slug]);

  const update = (id: string, value: DecisionValue) => {
    setAnswers((current) => ({ ...current, [id]: value }));
    setErrors((current) => ({ ...current, [id]: "" }));
  };
  const next = () => {
    if (!currentQuestion) return;
    const nextErrors = validateAnswers([currentQuestion], answers, facts);
    if (Object.keys(nextErrors).length) { setErrors((current) => ({ ...current, ...nextErrors })); return; }
    setStep((current) => Math.min(current + 1, questions.length - 1));
  };
  const reset = () => { setAnswers(createDefaultAnswers(workflow.questions)); setErrors({}); setStep(0); void adapters.memory.clearDraft(workflow.id); };
  const complete = async () => {
    const nextErrors = validateAnswers(questions, answers, facts);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const firstInvalid = questions.findIndex((question) => nextErrors[question.id]);
      if (firstInvalid >= 0) setStep(firstInvalid);
      return;
    }
    const id = createDecisionId("decision");
    const now = new Date().toISOString();
    const finalReport = buildDecisionReport(workflow, answers, { id: `report_${id}`, generatedAt: now });
    const stored = buildDecisionRecord({ id, workflow, answers, report: finalReport, createdAt: now, updatedAt: now });
    await repository.saveDecision(stored);
    await adapters.memory.clearDraft(workflow.id);
    router.push(`/decision/result/${stored.id}`);
  };

  return <main className="mx-auto max-w-7xl overflow-x-hidden px-4 py-8 sm:px-6 sm:py-12"><div className="flex max-w-4xl flex-wrap items-center gap-2"><Badge>{workflow.category ?? workflow.pluginId}</Badge><DecisionAccuracyBadge analysis={profileAnalysis} /></div><h1 className="mt-4 max-w-4xl text-balance text-3xl font-bold tracking-[-.035em] sm:text-5xl">{workflow.title}</h1><p className="mt-3 max-w-3xl text-base leading-7 text-muted sm:text-lg">{workflow.description}</p><div className="mt-6 max-w-3xl"><DecisionProgress value={progress} current={Math.min(step + 1, questions.length)} total={questions.length} /></div>
    <div className="mt-8 grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0">
        <div className="md:hidden">{currentQuestion && <DecisionQuestion question={currentQuestion} value={answers[currentQuestion.id]} onChange={(value) => update(currentQuestion.id, value)} error={errors[currentQuestion.id]} />}</div>
        <div className="hidden min-w-0 gap-4 md:grid md:grid-cols-2">{questions.map((question) => <DecisionQuestion key={question.id} question={question} value={answers[question.id]} onChange={(value) => update(question.id, value)} error={errors[question.id]} />)}</div>
        <Card className="mt-5 flex min-w-0 flex-col gap-4 bg-gradient-to-br from-primary/[.04] to-accent/[.06] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div className="flex min-w-0 gap-3"><ShieldCheck className="shrink-0 text-primary" /><div><p className="font-bold">Private by default</p><p className="mt-1 text-sm text-muted">Answers and results remain in this browser.</p></div></div><div className="flex w-full flex-wrap gap-2 sm:w-auto"><Button variant="ghost" onClick={reset}><RotateCcw size={16} /> Reset</Button>{step > 0 && <Button variant="secondary" className="md:hidden" onClick={() => setStep((current) => current - 1)}><ArrowLeft size={16} /> Back</Button>}{step < questions.length - 1 ? <Button className="ml-auto md:hidden" onClick={next}>Next <ArrowRight size={16} /></Button> : <Button className="ml-auto md:hidden" onClick={complete}>View result <ArrowRight size={16} /></Button>}<Button className="ml-auto hidden md:inline-flex" onClick={complete}>View recommendation <ArrowRight size={16} /></Button></div></Card>
        {(workflow.faqs?.length ?? 0) > 0 && <section className="mt-10"><h2 className="text-2xl font-bold">Common questions</h2><div className="mt-4 space-y-3">{workflow.faqs?.map((item) => <details key={item.question} className="rounded-2xl border border-border bg-white p-5"><summary className="cursor-pointer font-semibold">{item.question}</summary><p className="mt-3 text-sm leading-6 text-muted">{item.answer}</p></details>)}</div></section>}
      </div>
      <aside className="min-w-0 space-y-4 lg:sticky lg:top-24"><DecisionScoreCard score={report.score} /><Card className="p-5"><p className="text-sm font-bold">Live decision signals</p><div className="mt-3 space-y-2">{report.ruleEvaluations.filter(({ matched }) => matched).slice(0, 5).map(({ rule }) => <div key={rule.id} className={`rounded-xl px-3 py-2 text-xs font-semibold ${rule.risk ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`}>{rule.description}</div>)}{!report.ruleEvaluations.some(({ matched }) => matched) && <p className="text-sm text-muted">Adjust your answers to reveal the strongest signals.</p>}</div></Card></aside>
    </div>
  </main>;
}
