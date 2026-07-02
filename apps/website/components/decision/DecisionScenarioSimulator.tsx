"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, RotateCcw, SlidersHorizontal, Sparkles } from "lucide-react";
import { Button, Card } from "@datastorified/ui";
import { SmartNumberInput } from "@datastorified/ui/smart-number-input";
import {
  buildDecisionReport,
  formatDecisionValue,
  type DecisionAnswers,
  type DecisionQuestion,
  type DecisionReport,
  type DecisionScenario,
  type DecisionScenarioVariable,
  type DecisionWorkflow,
} from "@datastorified/decision-os";

type ScenarioControl = DecisionScenarioVariable & {
  question: DecisionQuestion;
};

const numericTypes = new Set<DecisionQuestion["type"]>(["currency", "percentage", "number", "duration", "slider"]);

function modeFor(question: DecisionQuestion) {
  if (question.type === "currency") return "currency";
  if (question.type === "percentage") return "percentage";
  if (question.type === "duration") return "years";
  return "decimal";
}

function formatChipLabel(control: ScenarioControl, chip: number) {
  if (control.relativeTo) {
    const pct = Math.round(chip);
    return `${pct > 0 ? "+" : ""}${pct}%`;
  }
  if (control.question.type === "currency") return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(chip);
  if (control.question.type === "percentage") return `${chip}%`;
  if (control.question.type === "duration") return `${chip} years`;
  if (control.question.type === "slider" && Number.isInteger(chip)) return String(chip);
  return new Intl.NumberFormat("en-IN").format(chip);
}

function toScenarioValue(control: ScenarioControl, chip: number, answers: DecisionAnswers) {
  if (control.relativeTo) {
    const base = typeof answers[control.relativeTo] === "number" ? Number(answers[control.relativeTo]) : 0;
    return base * (1 + chip / 100);
  }
  return chip;
}

function buildControls(workflow: DecisionWorkflow): ScenarioControl[] {
  const byId = new Map(workflow.questions.map((question) => [question.id, question]));
  const configured = workflow.scenarioVariables?.map((variable) => {
    const question = byId.get(variable.questionId);
    return question && numericTypes.has(question.type)
      ? { ...variable, question }
      : undefined;
  }).filter(Boolean) as ScenarioControl[] | undefined;
  if (configured && configured.length > 0) return configured;
  return workflow.questions
    .filter((question) => numericTypes.has(question.type))
    .slice(0, 4)
    .map((question) => ({ id: question.id, questionId: question.id, label: question.prompt, description: question.helperText, question }));
}

function FactorChart({ baseReport, scenarioReport }: { baseReport: DecisionReport; scenarioReport: DecisionReport }) {
  const scenarioById = new Map(scenarioReport.score.factors.map((factor) => [factor.factorId, factor]));
  const max = Math.max(...baseReport.score.factors.map((factor) => Math.max(factor.contribution, scenarioById.get(factor.factorId)?.contribution ?? 0)), 1);

  return (
    <Card className="min-w-0 p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><BarChart3 size={19} /></span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Factor change chart</p>
          <h3 className="text-lg font-bold">How the score moved</h3>
        </div>
      </div>
      <div className="mt-5 space-y-4">
        {baseReport.score.factors.map((factor) => {
          const next = scenarioById.get(factor.factorId);
          const delta = Math.round(((next?.contribution ?? factor.contribution) - factor.contribution) * 10) / 10;
          return (
            <div key={factor.factorId} className="rounded-2xl border border-border/70 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">{factor.label}</p>
                  <p className="text-xs text-muted">Baseline {Math.round(factor.contribution)} · Scenario {Math.round(next?.contribution ?? factor.contribution)}</p>
                </div>
                <p className={`text-sm font-bold ${delta > 0 ? "text-success" : delta < 0 ? "text-warning" : "text-muted"}`}>{delta === 0 ? "No change" : `${delta > 0 ? "+" : ""}${delta}`}</p>
              </div>
              <div className="mt-3 grid gap-2">
                <div className="h-2 rounded-full bg-soft"><div className="h-2 rounded-full bg-primary/40" style={{ width: `${Math.max(4, (factor.contribution / max) * 100)}%` }} /></div>
                <div className="h-2 rounded-full bg-soft"><div className="h-2 rounded-full bg-accent/60" style={{ width: `${Math.max(4, ((next?.contribution ?? factor.contribution) / max) * 100)}%` }} /></div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function DecisionScenarioSimulator({ workflow, answers, baseReport }: { workflow: DecisionWorkflow; answers: DecisionAnswers; baseReport: DecisionReport }) {
  const controls = useMemo(() => buildControls(workflow), [workflow]);
  const [overrides, setOverrides] = useState<DecisionAnswers>({});
  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    setOverrides({});
    setActivePreset(null);
  }, [workflow.id]);

  const scenarioAnswers = useMemo(() => ({ ...answers, ...overrides }), [answers, overrides]);
  const scenarioReport = useMemo(() => buildDecisionReport(workflow, scenarioAnswers), [scenarioAnswers, workflow]);
  const scoreDelta = Math.round((scenarioReport.score.value - baseReport.score.value) * 10) / 10;
  const recommendationChanged = scenarioReport.recommendation?.id !== baseReport.recommendation?.id;

  if (!controls.length) return null;

  const updateValue = (questionId: string, value: number) => {
    setOverrides((current) => ({ ...current, [questionId]: value }));
    setActivePreset(null);
  };

  const applyScenario = (scenario: DecisionScenario) => {
    setOverrides((current) => ({ ...current, ...scenario.overrides }));
    setActivePreset(scenario.id);
  };

  const resetScenario = () => {
    setOverrides({});
    setActivePreset(null);
  };

  return (
    <Card className="min-w-0 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><SlidersHorizontal size={19} /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">What if?</p>
              <h2 className="text-xl font-bold">See the score change before you commit</h2>
            </div>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Adjust the most sensitive variables, compare the score before and after, and reset the scenario whenever you want to start over. Your original answers stay unchanged.</p>
        </div>
        <Button variant="ghost" onClick={resetScenario}><RotateCcw size={16} /> Reset scenario</Button>
      </div>

      {workflow.scenarios?.length ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {workflow.scenarios.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              onClick={() => applyScenario(scenario)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${activePreset === scenario.id ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border bg-white text-muted hover:border-primary/30 hover:text-primary"}`}
            >
              {scenario.label}
              {activePreset === scenario.id && <Sparkles size={14} />}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4">
          {controls.map((control) => {
            const question = control.question;
            const currentValue = typeof scenarioAnswers[control.questionId] === "number" ? Number(scenarioAnswers[control.questionId]) : null;
            const chips = (control.chips ?? []).map((chip) => ({
              label: formatChipLabel(control, chip),
              value: toScenarioValue(control, chip, scenarioAnswers),
            }));
            return (
              <Card key={control.id} className="min-w-0 p-5">
                <SmartNumberInput
                  compact
                  label={control.label}
                  description={control.description ?? question.helperText}
                  mode={modeFor(question)}
                  value={currentValue}
                  min={question.validation?.min}
                  max={question.validation?.max}
                  step={question.step}
                showSlider
                showChips={chips.length > 0}
                chips={chips}
                defaultValue={typeof answers[control.questionId] === "number" ? Number(answers[control.questionId]) : null}
                onChange={(result) => result.numericValue !== null && updateValue(control.questionId, result.numericValue)}
                actions={["reset"]}
              />
                <p className="mt-2 text-xs text-muted">Original answer: {formatDecisionValue(answers[control.questionId])}</p>
              </Card>
            );
          })}
        </div>

        <div className="space-y-4">
          <Card className="min-w-0 bg-gradient-to-br from-primary/[.06] to-accent/[.08] p-6 text-center">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-muted">Before / after</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[.12em] text-muted">Before</p>
                <p className="mt-2 text-4xl font-bold text-ink">{Math.round(baseReport.score.value)}</p>
                <p className="mt-1 text-sm text-muted">{baseReport.score.label ?? "Baseline"}</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[.12em] text-muted">After</p>
                <p className="mt-2 text-4xl font-bold text-primary">{Math.round(scenarioReport.score.value)}</p>
                <p className={`mt-1 text-sm font-semibold ${scoreDelta > 0 ? "text-success" : scoreDelta < 0 ? "text-warning" : "text-muted"}`}>{scoreDelta === 0 ? "No score change" : `${scoreDelta > 0 ? "+" : ""}${scoreDelta} points`}</p>
              </div>
            </div>
          </Card>

          <Card className="min-w-0 p-5">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Recommendation update</p>
            <h3 className="mt-2 text-lg font-bold">{scenarioReport.recommendation?.title ?? "Recommendation unavailable"}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{scenarioReport.recommendation?.summary ?? "No recommendation could be generated for the current inputs."}</p>
            {recommendationChanged && baseReport.recommendation && (
              <p className="mt-3 rounded-2xl bg-warning/10 px-3 py-2 text-xs font-semibold text-warning">Changed from: {baseReport.recommendation.title}</p>
            )}
          </Card>

          <Card className="min-w-0 p-5">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Scenario logic</p>
            <p className="mt-2 text-sm leading-6 text-muted">These controls only affect the scenario preview. Your original answers remain untouched until you deliberately change them in the main workflow.</p>
            <div className="mt-4 space-y-2 text-sm">
              <p>Scenario score is recalculated live as you move sliders or tap chips.</p>
              <p>Preset chips apply common stress tests for this workflow.</p>
              <p>Reset returns the preview to the saved result inputs.</p>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <FactorChart baseReport={baseReport} scenarioReport={scenarioReport} />
      </div>
    </Card>
  );
}
