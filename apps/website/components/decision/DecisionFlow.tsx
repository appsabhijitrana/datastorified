"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight, ShieldCheck, Save } from "lucide-react";
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
import { DecisionScoreCard } from "./DecisionScoreCard";
import { LiveDecisionMeter } from "./LiveDecisionMeter";
import { AutosaveIndicator, DraftSavedToast } from "./TrustIndicators";
import { DecisionFocusLayout, SaveAndExitAction } from "./DecisionFocusLayout";
import { DecisionOSStatusService } from "../../lib/decision-os-status/service";
import { DecisionOSMaintenanceBanner } from "./DecisionOSMaintenanceBanner";
import { DecisionOSScheduledMaintenanceBanner } from "./DecisionOSScheduledMaintenanceBanner";
import { DecisionOSOutagePage } from "./DecisionOSOutagePage";

export function DecisionFlow({ pluginId, slug }: { pluginId: string; slug: string }) {
  const { state: maintenanceState, message: maintenanceMessage } = DecisionOSStatusService.getStatus();
  const workflow = decisionPluginRegistry.getWorkflowBySlug(slug);
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const repository = useMemo(() => new HybridDecisionRepository({ 
    authenticated: Boolean(session?.user),
    isCloudAvailable: maintenanceState !== 'outage_blocking'
  }), [session?.user, maintenanceState]);
  const orchestrator = useMemo(() => new DecisionOrchestrator({ repository }), [repository]);
  const [state, setState] = useState<DecisionOrchestratorState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [profile, setProfile] = useState<DecisionProfileEnvelope | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const introHref = `/decision/${pluginId}/${slug}`;

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
          setDirty(false);
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
        .then(() => {
          setAutosaveState("saved");
          setDirty(false);
          setToastOpen(true);
          window.setTimeout(() => setToastOpen(false), 1800);
        })
        .catch(() => setAutosaveState("error"));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [orchestrator, state]);

  useEffect(() => {
    void (async () => {
      try {
        if (maintenanceState !== 'outage_blocking') {
          const profileEnvelope = await getDecisionAdapters().profile.getProfile();
          setProfile(profileEnvelope as DecisionProfileEnvelope);
        }
      } catch {
        // Profile is optional; ignore failures.
      }
    })();
  }, [maintenanceState]);

  if (maintenanceState === 'outage_blocking') {
    return <DecisionOSOutagePage message={maintenanceMessage} />;
  }

  if (!workflow || workflow.pluginId !== pluginId) {
    return <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6"><Card className="p-6">This decision is unavailable right now.</Card></main>;
  }

  if (loading || !state) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        {maintenanceState === 'maintenance_banner' && <DecisionOSMaintenanceBanner message={maintenanceMessage || "We are currently performing maintenance. Some features may be temporarily unavailable."} />}
        {maintenanceState === 'scheduled_maintenance' && <DecisionOSScheduledMaintenanceBanner message={maintenanceMessage || "Scheduled maintenance is in progress. The platform will be back to full functionality soon."} />}
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
  const update = (questionId: string, value: DecisionValue) => {
    const nextState = orchestrator.setAnswer(state.session.id, questionId, value, { advance: false });
    setState(nextState);
    setValidationErrors((current) => ({ ...current, [questionId]: "" }));
    setAutosaveState("idle");
    setDirty(true);
  };

  const saveDraftNow = async (): Promise<boolean> => {
    setAutosaveState("saving");
    try {
      await orchestrator.saveDraft(state.session);
      setAutosaveState("saved");
      setDirty(false);
      setToastOpen(true);
      window.setTimeout(() => setToastOpen(false), 1800);
      return true;
    } catch {
      setAutosaveState("error");
      return false;
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
    if (!window.confirm("Reset this decision? Your current answers and draft will be cleared.")) return;
    setState(orchestrator.startDecision(workflow.slug));
    setValidationErrors({});
    setCompleteError(null);
    setDirty(false);
    await orchestrator.clearDraft(workflow.id);
  };

  const complete = async () => {
    const errors = validateAnswers(visibleQuestions, state.session.answers, buildDecisionFacts(workflow, state.session.answers));
    setValidationErrors(errors);
    if (Object.keys(errors).length) return;
    setCompleting(true);
    setCompleteError(null);
    try {
      const result = orchestrator.completeDecision(state.session.id);
      const saved = await orchestrator.saveResult(result);
      await orchestrator.clearDraft(workflow.id);
      setDirty(false);
      router.push(`/decision/result/${saved.id}`);
    } catch (err) {
      setCompleteError(err instanceof Error ? err.message : "Could not save your result. Please try again.");
      setCompleting(false);
    }
  };

  const activeQuestion = currentQuestion ?? visibleQuestions[0];
  const activeQuestionIndex = visibleQuestions.findIndex((question) => question.id === activeQuestion?.id);
  const canGoBack = activeQuestionIndex > 0;
  const canGoNext = activeQuestionIndex >= 0 && activeQuestionIndex < visibleQuestions.length - 1;
  const questionTotal = visibleQuestions.length;
  const requestExit = () => {
    if (!dirty) {
      router.push(introHref);
      return;
    }
    setExitOpen(true);
  };
  const exitWithoutSaving = () => {
    setExitOpen(false);
    router.push(introHref);
  };
  const saveAndExit = async () => {
    const saved = await saveDraftNow();
    if (saved) {
      setExitOpen(false);
      router.push(introHref);
    }
  };

  return (
    <>
      {maintenanceState === 'maintenance_banner' && <DecisionOSMaintenanceBanner message={maintenanceMessage || "We are currently performing maintenance. Some features may be temporarily unavailable."} />}
      {maintenanceState === 'scheduled_maintenance' && <DecisionOSScheduledMaintenanceBanner message={maintenanceMessage || "Scheduled maintenance is in progress. The platform will be back to full functionality soon."} />}
      <main className="mx-auto max-w-7xl overflow-x-hidden px-4 py-8 sm:px-6 sm:py-12">
        <DecisionFocusLayout
          title={workflow.title}
          dirty={dirty}
          exitOpen={exitOpen}
          onBack={requestExit}
          onSaveAndExit={saveAndExit}
          onExitWithoutSaving={exitWithoutSaving}
          onContinue={() => setExitOpen(false)}
        >
        <div className="flex max-w-4xl flex-wrap items-center gap-2">
          <Badge>{workflow.category ?? workflow.pluginId}</Badge>
          <DecisionAccuracyBadge analysis={profileAnalysis} />
        </div>

        <h1 className="mt-4 max-w-4xl text-balance text-3xl font-bold tracking-[-.035em] sm:text-5xl">{workflow.title}</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-muted sm:text-lg">{workflow.description}</p>
        <div className="mt-6 max-w-3xl">
          <DecisionProgress value={state.progress} current={activeQuestionIndex + 1} total={questionTotal} />
        </div>

        <div className="mt-8 grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-2 lg:hidden">
              <AutosaveIndicator
                status={autosaveState}
                updatedAt={state.session.updatedAt}
                syncState={session?.user ? "pending" : "idle"}
                onRetry={saveDraftNow}
              />
            </div>
            <div className="mb-4 lg:hidden">
              <LiveDecisionMeter
                preview={preview}
                answerProgress={{ answered: visibleQuestions.filter((question) => isAnsweredValue(state.session.answers[question.id])).length, total: visibleQuestions.length }}
                profileAnalysis={profileAnalysis}
                collapsedByDefault={(typeof window !== "undefined" && window.innerHeight < 760) || false}
              />
            </div>
            {activeQuestion && (
              <Card className="min-w-0 rounded-[2rem] p-4 sm:p-6 lg:p-8">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">{activeQuestion.required === false ? "Optional" : "Required"}</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{activeQuestion.prompt}</h2>
                  </div>
                  <div className="hidden rounded-full border border-border bg-soft/40 px-3 py-2 text-xs font-semibold text-muted md:inline-flex">
                    {activeQuestionIndex + 1} of {questionTotal}
                  </div>
                </div>
                <DecisionQuestion
                  question={activeQuestion}
                  value={state.session.answers[activeQuestion.id]}
                  onChange={(value) => update(activeQuestion.id, value)}
                  error={validationErrors[activeQuestion.id]}
                  helperOverride={activeQuestion.helperText}
                  whyWeAsk={getWhyWeAsk(activeQuestion)}
                />
              </Card>
            )}

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
                <Button variant="ghost" onClick={saveDraftNow} disabled={autosaveState === "saving"}><Save size={16} /> Save draft</Button>
                <Button variant="secondary" onClick={reset} disabled={completing}>Reset</Button>
                <SaveAndExitAction onClick={saveAndExit} disabled={autosaveState === "saving"} />
                {session?.user ? null : <GoogleSignInButton className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-soft">Sign in with Google</GoogleSignInButton>}
                {canGoBack && <Button variant="secondary" className="min-h-11 md:hidden" onClick={back} disabled={completing}><ArrowLeft size={16} /> Back</Button>}
                {canGoNext ? (
                  <Button className="ml-auto min-h-11 md:hidden" onClick={next} disabled={completing}>Next <ArrowRight size={16} /></Button>
                ) : (
                  <Button className="ml-auto min-h-11 md:hidden" onClick={complete} disabled={completing}>{completing ? "Saving result…" : "View result"} <ArrowRight size={16} /></Button>
                )}
                <Button className="ml-auto hidden min-h-11 md:inline-flex" onClick={complete} disabled={completing}>{completing ? "Saving result…" : "View result"} <ArrowRight size={16} /></Button>
              </div>
            </Card>

            {completeError && (
              <Card className="mt-5 border-danger/20 bg-danger/[.04] p-5" role="alert">
                <p className="text-sm font-semibold text-danger">{completeError}</p>
                <Button className="mt-3" variant="secondary" onClick={complete} disabled={completing}>Try again</Button>
              </Card>
            )}

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
            <AutosaveIndicator status={autosaveState} updatedAt={state.session.updatedAt} syncState={session?.user ? "pending" : "idle"} onRetry={saveDraftNow} />
            <LiveDecisionMeter
              preview={preview}
              answerProgress={{ answered: visibleQuestions.filter((question) => isAnsweredValue(state.session.answers[question.id])).length, total: visibleQuestions.length }}
              profileAnalysis={profileAnalysis}
            />
            <Card className="p-5">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Journey</p>
              <p className="mt-2 text-lg font-bold">{activeQuestionIndex + 1} of {questionTotal}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{activeQuestion?.required === false ? "This step is optional." : "This step is required to continue."}</p>
              {activeQuestion?.required === false && <Button variant="secondary" className="mt-4 min-h-11" onClick={next}>Skip</Button>}
            </Card>
            <DecisionScoreCard score={score} />
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

        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:hidden">
          <div className="pointer-events-auto mx-auto flex max-w-4xl items-center gap-2 rounded-[1.5rem] border border-border bg-white/95 p-3 shadow-2xl backdrop-blur">
            {canGoBack ? <Button variant="secondary" className="min-h-11 flex-1" onClick={back} disabled={completing}><ArrowLeft size={16} /> Back</Button> : <Button variant="secondary" className="min-h-11 flex-1" disabled>Back</Button>}
            {canGoNext ? (
              <Button className="min-h-11 flex-1" onClick={next} disabled={completing}>Next <ChevronRight size={16} /></Button>
            ) : (
              <Button className="min-h-11 flex-1" onClick={complete} disabled={completing}>{completing ? "Saving…" : "View Result"} <ChevronRight size={16} /></Button>
            )}
          </div>
        </div>
        <DraftSavedToast open={toastOpen} message={session?.user ? "Draft saved locally. Sync pending." : "Draft saved locally."} />
        </DecisionFocusLayout>
      </main>
    </>
  );
}

function getWhyWeAsk(question: { prompt: string; helperText?: string; type: string; required?: boolean }): string {
  const prompt = question.prompt.toLowerCase();
  if (prompt.includes("income") || prompt.includes("salary")) return "This helps calibrate affordability and trade-offs.";
  if (prompt.includes("risk")) return "This helps tune the recommendation to your comfort level.";
  if (prompt.includes("time")) return "This helps match the decision to your horizon.";
  if (question.type === "boolean") return "A simple yes/no helps the engine narrow the options quickly.";
  return "This helps the engine compare the trade-offs that matter most for this decision.";
}

function isAnsweredValue(value: DecisionValue | undefined): boolean {
  return value !== undefined && value !== null && value !== "" && (!Array.isArray(value) || value.length > 0);
}
