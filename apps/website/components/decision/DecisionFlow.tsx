"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ShieldCheck, Save } from "lucide-react";
import { Badge, Button, Card } from "@datastorified/ui";
import {
  buildDecisionFacts,
  decisionPluginRegistry,
  getVisibleQuestions,
  validateAnswers,
  type DecisionOrchestratorState,
  type DecisionValue,
} from "@datastorified/decision-os";
import { DecisionOrchestrator } from "@datastorified/decision-os/core/orchestrator";
import { authClient, GoogleSignInButton } from "@datastorified/auth";
import { HybridDecisionRepository } from "@datastorified/decision-repository";
import { getProfileAnalysis, type DecisionProfileEnvelope } from "@datastorified/profile";
import { getDecisionAdapters } from "@datastorified/decision-os/adapters";
import { DecisionAccuracyBadge } from "./DecisionAccuracyBadge";
import { DecisionProgress } from "./DecisionProgress";
import { DecisionQuestion } from "./DecisionQuestion";
import { DecisionRecommendation } from "./DecisionRecommendation";
import { DecisionScoreCard } from "./DecisionScoreCard";

export function DecisionFlow({ pluginId, slug }: { pluginId: string; slug: string }) {
  const workflow = decisionPluginRegistry.getWorkflowBySlug(slug);
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const repository = useMemo(() => new HybridDecisionRepository({ authenticated: Boolean(session?.user) }), [session?.user]);
  const orchestrator = useMemo(() => new DecisionOrchestrator({ repository }), [repository]);
  const [state, setState] = useState<DecisionOrchestratorState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [profile, setProfile] = useState<DecisionProfileEnvelope | null>(null);

  useEffect(() => {
    if (!workflow || workflow.pluginId !== pluginId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const loaded = await orchestrator.loadDraft(workflow.id);
        const nextState = loaded ?? orchestrator.startDecision(workflow.slug);
        if (!cancelled) {
          setState(nextState);
          setValidationErrors({});
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not start the decision flow.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [orchestrator, pluginId, workflow]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!state) return;
      setAutosaveState("saving");
      void orchestrator.saveDraft(state.session)
        .then(() => setAutosaveState("saved"))
        .catch(() => setAutosaveState("error"));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [orchestrator, state]);

  useEffect(() => {
    void (async () => {
      try {
        const profileEnvelope = await getDecisionAdapters().profile.getProfile();
        setProfile(profileEnvelope as DecisionProfileEnvelope);
      } catch {
        // Profile is optional; ignore failures.
      }
    })();
  }, []);

  if (!workflow || workflow.pluginId !== pluginId) {
    return <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6"><Card className="p-6">This decision is unavailable right now.</Card></main>;
  }

  if (loading || !state) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="h-72 animate-pulse rounded-3xl bg-soft" />
          <Card className="h-72 animate-pulse rounded-3xl bg-soft" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <Card className="p-6">
          <p className="text-sm font-bold uppercase tracking-[.14em] text-primary">We hit a snag</p>
          <h1 className="mt-3 text-2xl font-bold">We could not start this decision flow.</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{error}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={() => window.location.reload()}>Try again</Button>
            <Button variant="secondary" onClick={() => router.push("/decision")}>Back to Decision OS</Button>
          </div>
        </Card>
      </main>
    );
  }

  const currentQuestion = orchestrator.getCurrentQuestion(state.session.id);
  const visibleQuestions = getVisibleQuestions(workflow.questions, state.session.answers, buildDecisionFacts(workflow, state.session.answers));
  const profileAnalysis = getProfileAnalysis(profile?.profile);
  const preview = state.preview;
  const score = preview.report.score;
  const recommendation = preview.recommendation;

  const update = (questionId: string, value: DecisionValue) => {
    const nextState = orchestrator.setAnswer(state.session.id, questionId, value, { advance: false });
    setState(nextState);
    setValidationErrors((current) => ({ ...current, [questionId]: "" }));
    setAutosaveState("idle");
  };

  const saveDraftNow = async () => {
    setAutosaveState("saving");
    try {
      await orchestrator.saveDraft(state.session);
      setAutosaveState("saved");
    } catch {
      setAutosaveState("error");
    }
  };

  const next = () => {
    if (!currentQuestion) return;
    const nextErrors = validateAnswers([currentQuestion], state.session.answers, buildDecisionFacts(workflow, state.session.answers));
    if (Object.keys(nextErrors).length) {
      setValidationErrors((current) => ({ ...current, ...nextErrors }));
      return;
    }
    setValidationErrors({});
    setState(orchestrator.advanceCurrentQuestion(state.session.id));
  };

  const back = () => {
    setState(orchestrator.goBackCurrentQuestion(state.session.id));
  };

  const reset = async () => {
    setState(orchestrator.startDecision(workflow.slug));
    setValidationErrors({});
    await orchestrator.clearDraft(workflow.id);
  };

  const complete = async () => {
    const errors = validateAnswers(visibleQuestions, state.session.answers, buildDecisionFacts(workflow, state.session.answers));
    setValidationErrors(errors);
    if (Object.keys(errors).length) return;
    const result = orchestrator.completeDecision(state.session.id);
    const saved = await orchestrator.saveResult(result);
    await orchestrator.clearDraft(workflow.id);
    router.push(`/decision/result/${saved.id}`);
  };

  const mobileQuestion = currentQuestion ?? visibleQuestions[0];

  return (
    <main className="mx-auto max-w-7xl overflow-x-hidden px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex max-w-4xl flex-wrap items-center gap-2">
        <Badge>{workflow.category ?? workflow.pluginId}</Badge>
        <DecisionAccuracyBadge analysis={profileAnalysis} />
      </div>

      <h1 className="mt-4 max-w-4xl text-balance text-3xl font-bold tracking-[-.035em] sm:text-5xl">{workflow.title}</h1>
      <p className="mt-3 max-w-3xl text-base leading-7 text-muted sm:text-lg">{workflow.description}</p>
      <div className="mt-6 max-w-3xl">
        <DecisionProgress value={state.progress} current={visibleQuestions.findIndex((question) => question.id === mobileQuestion?.id) + 1} total={visibleQuestions.length} />
      </div>

      <div className="mt-8 grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <div className="md:hidden">
            {mobileQuestion && (
              <DecisionQuestion
                question={mobileQuestion}
                value={state.session.answers[mobileQuestion.id]}
                onChange={(value) => update(mobileQuestion.id, value)}
                error={validationErrors[mobileQuestion.id]}
              />
            )}
          </div>

          <div className="hidden min-w-0 gap-4 md:grid md:grid-cols-2">
            {visibleQuestions.map((question) => (
              <DecisionQuestion
                key={question.id}
                question={question}
                value={state.session.answers[question.id]}
                onChange={(value) => update(question.id, value)}
                error={validationErrors[question.id]}
              />
            ))}
          </div>

          <Card className="mt-5 flex min-w-0 flex-col gap-4 bg-gradient-to-br from-primary/[.04] to-accent/[.06] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex min-w-0 gap-3">
              <ShieldCheck className="shrink-0 text-primary" />
              <div>
                <p className="font-bold">Private by default</p>
                <p className="mt-1 text-sm text-muted">
                  {session?.user ? "Your decision is saved on this device, and you can sync it to your account when ready." : "Your decision is saved on this device. Sign in to back it up."}
                </p>
              </div>
            </div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <Button variant="ghost" onClick={saveDraftNow}><Save size={16} /> Save draft</Button>
              <Button variant="secondary" onClick={reset}>Reset</Button>
              {session?.user ? null : <GoogleSignInButton className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-soft">Sign in with Google</GoogleSignInButton>}
              {mobileQuestion && visibleQuestions.findIndex((question) => question.id === mobileQuestion.id) > 0 && (
                <Button variant="secondary" className="md:hidden" onClick={back}><ArrowLeft size={16} /> Back</Button>
              )}
              {mobileQuestion && visibleQuestions.findIndex((question) => question.id === mobileQuestion.id) < visibleQuestions.length - 1 ? (
                <Button className="ml-auto md:hidden" onClick={next}>Next <ArrowRight size={16} /></Button>
              ) : (
                <Button className="ml-auto md:hidden" onClick={complete}>View result <ArrowRight size={16} /></Button>
              )}
              <Button className="ml-auto hidden md:inline-flex" onClick={complete}>View recommendation <ArrowRight size={16} /></Button>
            </div>
          </Card>

          {!session?.user && (
            <Card className="mt-5 border-primary/15 bg-primary/[.04] p-5">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Optional sign in</p>
              <h2 className="mt-2 text-xl font-bold">Sign in to save and sync your decisions across devices.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                You can keep going anonymously. A Google sign-in later will unlock backup and sync without blocking the decision flow.
              </p>
            </Card>
          )}

          {(workflow.faqs?.length ?? 0) > 0 && (
            <section className="mt-10">
              <h2 className="text-2xl font-bold">Common questions</h2>
              <div className="mt-4 space-y-3">
                {workflow.faqs?.map((item) => (
                  <details key={item.question} className="rounded-2xl border border-border bg-white p-5">
                    <summary className="cursor-pointer font-semibold">{item.question}</summary>
                    <p className="mt-3 text-sm leading-6 text-muted">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-24">
          <DecisionScoreCard score={score} />
          <DecisionRecommendation recommendation={recommendation} analysis={profileAnalysis} note={autosaveState === "saved" ? "Draft saved locally." : autosaveState === "saving" ? "Saving draft…" : autosaveState === "error" ? "Draft save failed. You can still continue." : undefined} />
          <Card className="p-5">
            <p className="text-sm font-bold">Live decision signals</p>
            <div className="mt-3 space-y-2">
              {preview.report.ruleEvaluations.filter(({ matched }) => matched).slice(0, 5).map(({ rule }) => (
                <div key={rule.id} className={`rounded-xl px-3 py-2 text-xs font-semibold ${rule.risk ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`}>
                  {rule.description}
                </div>
              ))}
              {!preview.report.ruleEvaluations.some(({ matched }) => matched) && <p className="text-sm text-muted">Adjust your answers to reveal the strongest signals.</p>}
            </div>
          </Card>
        </aside>
      </div>
    </main>
  );
}
