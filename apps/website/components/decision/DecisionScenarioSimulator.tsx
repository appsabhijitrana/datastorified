"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, SlidersHorizontal, Sparkles } from "lucide-react";
import { Button, Card } from "@datastorified/ui";
import { SmartNumberInput } from "@datastorified/ui/smart-number-input";
import {
  buildDecisionReport,
  type DecisionAnswers,
  type DecisionQuestion,
  type DecisionReport,
  type DecisionScenario,
  type DecisionScenarioVariable,
  type DecisionWorkflow,
} from "@datastorified/decision-os";

type ScenarioControl = DecisionScenarioVariable & { question: DecisionQuestion };
type ScenarioState = {
  amount?: number | null;
  timeline?: number | null;
  riskComfort?: number | null;
  liquidityNeed?: number | null;
  inflationAssumption?: number | null;
  incomeStability?: number | null;
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
    .slice(0, 6)
    .map((question, index) => ({
      id: question.id,
      questionId: question.id,
      label: scenarioLabels[index] ?? question.prompt,
      description: question.helperText,
      question,
    }));
}

function inferScenarioPreview(workflow: DecisionWorkflow, answers: DecisionAnswers, baseReport: DecisionReport, state: ScenarioState) {
  const scenarioAnswers = { ...answers };
  const amount = state.amount ?? (typeof answers.amount === "number" ? Number(answers.amount) : undefined);
  const timeline = state.timeline ?? (typeof answers.timeHorizon === "number" ? Number(answers.timeHorizon) : undefined);
  const riskComfort = state.riskComfort ?? (typeof answers.riskAppetite === "number" ? Number(answers.riskAppetite) : undefined);
  const liquidityNeed = state.liquidityNeed ?? (typeof answers.liquidityNeed === "number" ? Number(answers.liquidityNeed) : undefined);
  const inflationAssumption = state.inflationAssumption ?? (typeof answers.inflationAssumption === "number" ? Number(answers.inflationAssumption) : undefined);
  const incomeStability = state.incomeStability ?? (typeof answers.incomeStability === "number" ? Number(answers.incomeStability) : undefined);

  if (amount !== undefined) scenarioAnswers.amount = amount;
  if (timeline !== undefined) scenarioAnswers.timeHorizon = timeline;
  if (riskComfort !== undefined) scenarioAnswers.riskAppetite = riskComfort;
  if (liquidityNeed !== undefined) scenarioAnswers.liquidityNeed = liquidityNeed;
  if (inflationAssumption !== undefined) scenarioAnswers.inflationAssumption = inflationAssumption;
  if (incomeStability !== undefined) scenarioAnswers.incomeStability = incomeStability;

  const report = buildDecisionReport(workflow, scenarioAnswers);
  return {
    report,
    scoreDelta: report.score.value - baseReport.score.value,
  };
}

function useScenarioPreview(workflow: DecisionWorkflow, answers: DecisionAnswers, baseReport: DecisionReport, state: ScenarioState) {
  return useMemo(() => inferScenarioPreview(workflow, answers, baseReport, state), [answers, baseReport, state, workflow]);
}

export function ScenarioResetButton({ onReset }: { onReset: () => void }) {
  return <Button variant="ghost" onClick={onReset}><RotateCcw size={16} /> Reset scenario</Button>;
}

export function ScenarioSlider({ label, description, value, min, max, step = 1, onChange, chips, mode }: {
  label: string;
  description?: string;
  value: number | null;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  chips?: Array<{ label: string; value: number; action?: "set" | "add" }>;
  mode?: "currency" | "percentage" | "years" | "decimal";
}) {
  return (
    <Card className="min-w-0 p-5">
      <SmartNumberInput
        compact
        label={label}
        description={description}
        mode={mode ?? "decimal"}
        value={value}
        min={min}
        max={max}
        step={step}
        showSlider
        showChips={Boolean(chips?.length)}
        chips={chips}
        actions={[]}
        onChange={(result) => result.numericValue !== null && onChange(result.numericValue)}
      />
    </Card>
  );
}

export function ScenarioResultPreview({
  beforeScore,
  afterScore,
  scoreDelta,
  confidence,
  recommendation,
  recommendationChanged,
}: {
  beforeScore: number;
  afterScore: number;
  scoreDelta: number;
  confidence: number;
  recommendation?: string;
  recommendationChanged: boolean;
}) {
  return (
    <Card className="min-w-0 bg-gradient-to-br from-primary/[.06] to-accent/[.08] p-6 text-center">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-muted">Before / after preview</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[.12em] text-muted">Before</p>
          <p className="mt-2 text-4xl font-bold text-ink">{Math.round(beforeScore)}</p>
          <p className="mt-1 text-sm text-muted">Baseline</p>
        </div>
        <div className="rounded-2xl bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[.12em] text-muted">After</p>
          <p className="mt-2 text-4xl font-bold text-primary">{Math.round(afterScore)}</p>
          <p className={`mt-1 text-sm font-semibold ${scoreDelta > 0 ? "text-success" : scoreDelta < 0 ? "text-warning" : "text-muted"}`}>{scoreDelta === 0 ? "No score change" : `${scoreDelta > 0 ? "+" : ""}${Math.round(scoreDelta)} points`}</p>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-border bg-white p-4 text-left">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Preview confidence</p>
        <p className="mt-2 text-sm leading-6 text-muted">Current match confidence: {Math.round(confidence)}%</p>
        <p className="mt-1 text-sm leading-6 text-muted">Changing assumptions may change the result.</p>
        <p className="mt-1 text-sm leading-6 text-muted">This is only a preview until you explicitly save the scenario.</p>
      </div>
      <div className="mt-4 rounded-2xl border border-border bg-white p-4 text-left">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Trade-off hints</p>
        <p className="mt-2 text-sm leading-6 text-muted">{recommendation ?? "Adjust a control to see how the trade-offs move."}</p>
        {recommendationChanged && <p className="mt-2 text-xs font-semibold text-warning">Preview result differs from the saved result.</p>}
      </div>
    </Card>
  );
}

export function ScenarioAssumptionCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="min-w-0 p-4">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">{label}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{value}</p>
    </Card>
  );
}

export function ScenarioSimulatorSection({ workflow, answers, baseReport }: { workflow: DecisionWorkflow; answers: DecisionAnswers; baseReport: DecisionReport }) {
  const controls = useMemo(() => buildControls(workflow), [workflow]);
  const [state, setState] = useState<ScenarioState>({});
  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    setState({});
    setActivePreset(null);
  }, [workflow.id]);

  const preview = useScenarioPreview(workflow, answers, baseReport, state);
  const scoreDelta = Math.round((preview.report.score.value - baseReport.score.value) * 10) / 10;
  const recommendationChanged = preview.report.recommendation?.id !== baseReport.recommendation?.id;
  if (!controls.length) return null;

  const applyScenario = (scenario: DecisionScenario) => {
    setState((current) => ({ ...current, ...mapScenarioToState(scenario.overrides) }));
    setActivePreset(scenario.id);
  };

  const resetScenario = () => {
    setState({});
    setActivePreset(null);
  };

  const update = (key: keyof ScenarioState, value: number) => {
    setState((current) => ({ ...current, [key]: value }));
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
        <ScenarioResetButton onReset={resetScenario} />
      </div>

      {workflow.scenarios?.length ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {workflow.scenarios.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              aria-pressed={activePreset === scenario.id}
              onClick={() => applyScenario(scenario)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${activePreset === scenario.id ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border bg-white text-muted hover:border-primary/30 hover:text-primary"}`}
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
            const currentValue = currentValueFor(control, state, answers);
            const chips = (control.chips ?? []).map((chip) => ({
              label: formatChipLabel(control, chip),
              value: toScenarioValue(control, chip, answers),
            }));
            return (
              <ScenarioSlider
                key={control.id}
                label={control.label}
                description={control.description ?? question.helperText}
                value={currentValue}
                min={question.validation?.min ?? 0}
                max={question.validation?.max ?? 100}
                step={question.step}
                mode={modeFor(question)}
                chips={chips}
                onChange={(value) => update(stateKeyFor(control.questionId), value)}
              />
            );
          })}
        </div>

        <div className="space-y-4">
          <ScenarioResultPreview
            beforeScore={baseReport.score.value}
            afterScore={preview.report.score.value}
            scoreDelta={scoreDelta}
            confidence={preview.report.score.percentage}
            recommendation={preview.report.recommendation?.summary ?? "No recommendation could be generated for the current inputs."}
            recommendationChanged={recommendationChanged}
          />

          <Card className="min-w-0 p-5">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Scenario assumptions</p>
            <div className="mt-4 grid gap-3">
              <ScenarioAssumptionCard label="Amount" value={formatMaybeNumber(state.amount ?? answers.amount)} />
              <ScenarioAssumptionCard label="Timeline" value={formatMaybeNumber(state.timeline ?? answers.timeHorizon, "years")} />
              <ScenarioAssumptionCard label="Risk comfort" value={formatMaybeNumber(state.riskComfort ?? answers.riskAppetite)} />
              <ScenarioAssumptionCard label="Liquidity need" value={formatMaybeNumber(state.liquidityNeed ?? answers.liquidityNeed)} />
              <ScenarioAssumptionCard label="Inflation assumption" value={formatMaybeNumber(state.inflationAssumption ?? answers.inflationAssumption, "%")} />
              <ScenarioAssumptionCard label="Income stability" value={formatMaybeNumber(state.incomeStability ?? answers.incomeStability)} />
            </div>
          </Card>

          <Card className="min-w-0 p-5">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Scenario logic</p>
            <p className="mt-2 text-sm leading-6 text-muted">These controls only affect the scenario preview. Your original answers remain untouched until you deliberately change them in the main workflow.</p>
            <div className="mt-4 space-y-2 text-sm leading-6 text-muted">
              <p>Scenario score is recalculated live as you move sliders or tap chips.</p>
              <p>Preset chips apply common stress tests for this workflow.</p>
              <p>Reset returns the preview to the saved result inputs.</p>
            </div>
          </Card>
        </div>
      </div>
    </Card>
  );
}

export function DecisionScenarioSimulator(props: { workflow: DecisionWorkflow; answers: DecisionAnswers; baseReport: DecisionReport }) {
  return <ScenarioSimulatorSection {...props} />;
}

function mapScenarioToState(overrides: DecisionAnswers): ScenarioState {
  return {
    amount: typeof overrides.amount === "number" ? overrides.amount : undefined,
    timeline: typeof overrides.timeline === "number" ? overrides.timeline : typeof overrides.timeHorizon === "number" ? overrides.timeHorizon : undefined,
    riskComfort: typeof overrides.riskComfort === "number" ? overrides.riskComfort : typeof overrides.riskAppetite === "number" ? overrides.riskAppetite : undefined,
    liquidityNeed: typeof overrides.liquidityNeed === "number" ? overrides.liquidityNeed : undefined,
    inflationAssumption: typeof overrides.inflationAssumption === "number" ? overrides.inflationAssumption : undefined,
    incomeStability: typeof overrides.incomeStability === "number" ? overrides.incomeStability : undefined,
  };
}

function currentValueFor(control: ScenarioControl, state: ScenarioState, answers: DecisionAnswers) {
  const key = stateKeyFor(control.questionId);
  const stateValue = state[key];
  if (typeof stateValue === "number") return stateValue;
  const answerValue = answers[control.questionId];
  return typeof answerValue === "number" ? Number(answerValue) : null;
}

function stateKeyFor(questionId: string): keyof ScenarioState {
  if (questionId === "investmentAmount") return "amount";
  if (questionId === "timeHorizon") return "timeline";
  if (questionId === "riskAppetite" || questionId === "volatilityComfort") return "riskComfort";
  if (questionId === "liquidityNeed") return "liquidityNeed";
  if (questionId === "inflationAssumption") return "inflationAssumption";
  if (questionId === "incomeStability") return "incomeStability";
  return "timeline";
}

function formatMaybeNumber(value: unknown, suffix = "") {
  if (typeof value !== "number" || Number.isNaN(value)) return "Not changed";
  const formatted = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);
  return suffix ? `${formatted} ${suffix}` : formatted;
}

const scenarioLabels = ["Amount", "Timeline", "Risk comfort", "Liquidity need", "Inflation assumption", "Income stability"];
