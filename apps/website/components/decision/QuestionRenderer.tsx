"use client";

import type { DecisionQuestion as Question, DecisionScalar, DecisionValue } from "@datastorified/decision-os";
import { Banknote, CalendarClock, CheckCircle2, CircleHelp, Clock3, Gauge, HeartPulse, Lightbulb, MapPin, MoveRight, Sparkles, Wallet } from "lucide-react";
import { Badge, Card } from "@datastorified/ui";
import { SmartNumberInput } from "@datastorified/ui/smart-number-input";

type BaseProps = {
  question: Question;
  value: DecisionValue | undefined;
  onChange: (value: DecisionValue) => void;
  error?: string;
  disabled?: boolean;
  helperOverride?: string;
  whyWeAsk?: string;
};

type OptionValue = string | number | boolean;

function ValidationError({ message }: { message: string }) {
  return <p role="alert" className="mt-2 text-sm font-semibold text-danger">{message}</p>;
}

function Shell({
  question,
  title,
  helperText,
  whyWeAsk,
  children,
  error,
}: {
  question: Question;
  title: string;
  helperText?: string;
  whyWeAsk?: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <Card className="min-w-0 rounded-[1.75rem] p-4 sm:p-6">
      <div className="mb-4 space-y-2">
        <h3 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h3>
        {helperText && <p className="text-sm leading-6 text-muted">{helperText}</p>}
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-primary">Question {question.id}</p>
      </div>
      {whyWeAsk && <p className="mb-4 rounded-2xl border border-border bg-soft/40 px-4 py-3 text-sm leading-6 text-muted"><span className="font-semibold text-ink">Why we ask this:</span> {whyWeAsk}</p>}
      {children}
      {error && <ValidationError message={error} />}
    </Card>
  );
}

function OptionGrid({
  options,
  value,
  onChange,
  disabled,
  columns = "grid-cols-2 sm:grid-cols-3",
}: {
  options: Array<{ label: string; value: OptionValue }>;
  value: DecisionValue | undefined;
  onChange: (value: DecisionValue) => void;
  disabled?: boolean;
  columns?: string;
  }) {
    return (
      <div className={`grid gap-2 ${columns}`}>
        {options.map((option) => {
          const selected = Object.is(value, option.value);
          const Icon = getOptionIcon(option.label, option.value, selected);
          return (
            <button
              key={String(option.value)}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={`group flex min-h-16 items-center gap-3 rounded-[1.25rem] border px-4 py-3 text-left text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
              selected ? "border-primary/25 bg-primary/5 text-primary shadow-soft" : "border-border bg-white text-ink hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft"
            } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <span className={`grid size-10 shrink-0 place-items-center rounded-2xl transition ${selected ? "bg-primary text-white shadow-glow" : "bg-soft text-muted group-hover:bg-primary/10 group-hover:text-primary"}`}>
                <Icon size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate">{option.label}</span>
                <span className="mt-1 block text-xs font-medium text-muted">{selected ? "Selected" : "Tap to choose"}</span>
              </span>
              <span className={`grid size-7 shrink-0 place-items-center rounded-full border transition ${selected ? "border-primary bg-primary text-white" : "border-border bg-white text-transparent group-hover:border-primary/30 group-hover:text-primary"}`}>
                <CheckCircle2 size={14} />
              </span>
            </button>
          );
        })}
      </div>
    );
}

export function RadioQuestion({ question, value, onChange, error, disabled, helperOverride, whyWeAsk }: BaseProps) {
  const options = normalizeOptions(question);
  return (
    <Shell question={question} title={question.prompt} helperText={helperOverride ?? question.helperText} whyWeAsk={whyWeAsk ?? helperOverride ?? question.helperText} error={error}>
      <div className="mt-4">
        <OptionGrid options={options} value={value} onChange={onChange} disabled={disabled} />
      </div>
    </Shell>
  );
}

export function MultiSelectQuestion({ question, value, onChange, error, disabled, helperOverride, whyWeAsk }: BaseProps) {
  const options = normalizeOptions(question);
  const current: DecisionScalar[] = Array.isArray(value)
    ? value.flatMap((item) => (Array.isArray(item) ? [] : [item]))
    : [];
  return (
    <Shell question={question} title={question.prompt} helperText={helperOverride ?? question.helperText} whyWeAsk={whyWeAsk ?? helperOverride ?? question.helperText} error={error}>
      <div className="mt-4">
        <OptionGrid
          options={options}
          value={undefined}
          disabled={disabled}
          columns="grid-cols-2 sm:grid-cols-3"
          onChange={(next) => {
            const nextValue = current.some((item) => Object.is(item, next))
              ? (current.filter((item) => !Object.is(item, next)) as DecisionScalar[])
              : ([...current, next] as DecisionScalar[]);
            onChange(nextValue);
          }}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {current.map((item) => <Badge key={String(item)}>{String(item)}</Badge>)}
        </div>
      </div>
    </Shell>
  );
}

export function SliderQuestion({ question, value, onChange, error, disabled, helperOverride, whyWeAsk }: BaseProps) {
  const numeric = typeof value === "number" ? value : typeof question.defaultValue === "number" ? question.defaultValue : 0;
  return (
    <Shell question={question} title={question.prompt} helperText={helperOverride ?? question.helperText} whyWeAsk={whyWeAsk ?? helperOverride ?? question.helperText} error={error}>
      <div className="mt-4">
        <SmartNumberInput
          compact
          id={question.id}
          label={question.prompt}
          description={question.helperText}
          mode="decimal"
          value={numeric}
          min={question.validation?.min}
          max={question.validation?.max}
          step={question.step}
          required={question.required}
          showSlider
          onChange={(result) => {
            if (result.numericValue !== null) onChange(result.numericValue);
          }}
          actions={["reset"]}
          defaultValue={typeof question.defaultValue === "number" ? question.defaultValue : null}
          disabled={disabled}
        />
      </div>
    </Shell>
  );
}

export function CurrencyQuestion(props: BaseProps) {
  return <NumericQuestion {...props} mode="currency" />;
}

export function NumberQuestion(props: BaseProps) {
  return <NumericQuestion {...props} mode="decimal" />;
}

export function RangeQuestion(props: BaseProps) {
  return <NumericQuestion {...props} mode="decimal" showRange />;
}

export function YesNoQuestion({ question, value, onChange, error, disabled, helperOverride, whyWeAsk }: BaseProps) {
  return (
    <Shell question={question} title={question.prompt} helperText={helperOverride ?? question.helperText} whyWeAsk={whyWeAsk ?? helperOverride ?? question.helperText} error={error}>
      <div className="mt-4">
        <OptionGrid options={[{ label: "Yes", value: true }, { label: "No", value: false }]} value={value} onChange={onChange} disabled={disabled} columns="grid-cols-2" />
      </div>
    </Shell>
  );
}

export function ChipQuestion(props: BaseProps) {
  return <RadioQuestion {...props} />;
}

export function PriorityRankingQuestion({ question, value, onChange, error, disabled, helperOverride, whyWeAsk }: BaseProps) {
  const options = normalizeOptions(question);
  const current: DecisionScalar[] = Array.isArray(value)
    ? value.flatMap((item) => (Array.isArray(item) ? [] : [item]))
    : [];
  return (
    <Shell question={question} title={question.prompt} helperText={helperOverride ?? question.helperText} whyWeAsk={whyWeAsk ?? helperOverride ?? question.helperText} error={error}>
      <div className="mt-4 grid gap-2">
        {options.map((option) => {
          const position = current.findIndex((item) => Object.is(item, option.value));
          const label = position >= 0 ? `Rank ${position + 1}` : "Tap to rank";
          return (
            <button
              key={String(option.value)}
              type="button"
              disabled={disabled}
              onClick={() => {
                const next = current.filter((item) => !Object.is(item, option.value));
                next.unshift(option.value);
                onChange(next.slice(0, options.length));
              }}
              className="flex min-h-12 items-center justify-between rounded-2xl border border-border bg-white px-4 py-3 text-left text-sm font-semibold transition hover:border-primary/30"
            >
              <span>{option.label}</span>
              <span className="text-xs text-muted">{label}</span>
            </button>
          );
        })}
      </div>
    </Shell>
  );
}

export function RiskComfortQuestion(props: BaseProps) {
  return <RadioQuestion {...props} />;
}

export function TimelineQuestion(props: BaseProps) {
  return <RadioQuestion {...props} />;
}

export function TextQuestion({ question, value, onChange, error, disabled, helperOverride, whyWeAsk }: BaseProps) {
  return (
    <Shell question={question} title={question.prompt} helperText={helperOverride ?? question.helperText} whyWeAsk={whyWeAsk ?? helperOverride ?? question.helperText} error={error}>
      <textarea
        id={question.id}
        disabled={disabled}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        maxLength={question.validation?.maxLength}
        aria-invalid={Boolean(error)}
        className="mt-4 w-full min-w-0 resize-y rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
        placeholder="Add optional context…"
      />
    </Shell>
  );
}

export function UnsupportedQuestion({ question }: { question: Question }) {
  return (
    <Card className="min-w-0 rounded-[1.75rem] border-dashed border-danger/20 bg-danger/[.04] p-5">
      <p className="text-sm font-bold uppercase tracking-[.14em] text-danger">Unsupported question</p>
      <h3 className="mt-2 text-lg font-bold">{question.prompt}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">This workflow uses a question type that this renderer does not support yet.</p>
    </Card>
  );
}

export function QuestionRenderer(props: BaseProps) {
  switch (props.question.type) {
    case "single_choice":
    case "single-select":
    case "select":
      return <RadioQuestion {...props} />;
    case "multi_choice":
    case "multi-select":
      return <MultiSelectQuestion {...props} />;
    case "slider":
      return <SliderQuestion {...props} />;
    case "currency":
      return <CurrencyQuestion {...props} />;
    case "number":
      return <NumberQuestion {...props} />;
    case "duration":
      return <RangeQuestion {...props} />;
    case "boolean":
      return <YesNoQuestion {...props} />;
    case "text":
      return <TextQuestion {...props} />;
    case "percentage":
      return <NumberQuestion {...props} />;
    case "date":
      return <TextQuestion {...props} />;
    default:
      return <UnsupportedQuestion question={props.question} />;
  }
}

function normalizeOptions(question: Question): Array<{ label: string; value: OptionValue }> {
  if (question.type === "boolean") return [{ label: "Yes", value: true }, { label: "No", value: false }];
  return (question.options ?? []).map((option) => ({ label: option.label, value: option.value as OptionValue }));
}

function getOptionIcon(label: string, value: OptionValue, selected: boolean) {
  const normalized = `${label} ${String(value)}`.toLowerCase();
  if (normalized.includes("yes") || normalized.includes("true")) return CheckCircle2;
  if (normalized.includes("no") || normalized.includes("false")) return CircleHelp;
  if (normalized.includes("income") || normalized.includes("money") || normalized.includes("salary") || normalized.includes("budget")) return Banknote;
  if (normalized.includes("time") || normalized.includes("month") || normalized.includes("year") || normalized.includes("short")) return CalendarClock;
  if (normalized.includes("risk") || normalized.includes("safety")) return HeartPulse;
  if (normalized.includes("speed") || normalized.includes("fast") || normalized.includes("quick")) return Clock3;
  if (normalized.includes("score") || normalized.includes("confidence")) return Gauge;
  if (normalized.includes("idea") || normalized.includes("option") || normalized.includes("compare")) return Sparkles;
  if (normalized.includes("location") || normalized.includes("city") || normalized.includes("home")) return MapPin;
  if (normalized.includes("invest") || normalized.includes("savings") || normalized.includes("sip")) return Wallet;
  return selected ? MoveRight : Lightbulb;
}

function NumericQuestion({ question, value, onChange, error, disabled, helperOverride, whyWeAsk, mode, showRange = false }: BaseProps & { mode: "currency" | "decimal"; showRange?: boolean }) {
  const numeric = typeof value === "number" ? value : typeof question.defaultValue === "number" ? question.defaultValue : null;
  return (
    <Shell question={question} title={question.prompt} helperText={helperOverride ?? question.helperText} whyWeAsk={whyWeAsk ?? helperOverride ?? question.helperText} error={error}>
      <div className="mt-4">
        <SmartNumberInput
          compact
          id={question.id}
          label={question.prompt}
          description={question.helperText}
          mode={mode}
          value={numeric}
          min={question.validation?.min}
          max={question.validation?.max}
          step={question.step}
          required={question.required}
          showSlider={showRange}
          showStepper={question.type === "duration"}
          showWords={mode === "currency"}
          onChange={(result) => {
            if (result.numericValue !== null) onChange(result.numericValue);
          }}
          actions={["reset"]}
          defaultValue={typeof question.defaultValue === "number" ? question.defaultValue : null}
          disabled={disabled}
        />
      </div>
    </Shell>
  );
}
