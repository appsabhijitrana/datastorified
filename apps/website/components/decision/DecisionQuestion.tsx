"use client";

import type { DecisionQuestion as Question, DecisionValue } from "@datastorified/decision-os";
import { SmartNumberInput } from "@datastorified/ui/smart-number-input";
import { Card } from "@datastorified/ui";

function ValidationError({ message }: { message: string }) {
  return (
    <p role="alert" className="mt-2 text-sm font-semibold text-danger">
      {message}
    </p>
  );
}

export function DecisionQuestion({
  question,
  value,
  onChange,
  error,
  helperOverride,
  whyWeAsk,
}: {
  question: Question;
  value: DecisionValue | undefined;
  onChange: (value: DecisionValue) => void;
  error?: string;
  helperOverride?: string;
  whyWeAsk?: string;
}) {
  const numeric = ["currency", "percentage", "number", "duration", "slider"].includes(question.type);

  if (numeric) {
    const mode =
      question.type === "currency"
        ? "currency"
        : question.type === "percentage"
          ? "percentage"
          : question.type === "duration"
            ? "years"
            : "decimal";
    return (
      <div className="min-w-0">
        <SmartNumberInput
          compact
          id={question.id}
          label={question.prompt}
          description={helperOverride ?? question.helperText}
          mode={mode}
          value={typeof value === "number" ? value : null}
          min={question.validation?.min}
          max={question.validation?.max}
          step={question.step}
          required={question.required}
          showSlider={question.type === "slider"}
          showStepper={question.type === "duration"}
          showWords={question.type === "currency"}
          onChange={(result) => {
            if (result.numericValue !== null) onChange(result.numericValue);
          }}
          actions={["reset"]}
          defaultValue={typeof question.defaultValue === "number" ? question.defaultValue : null}
        />
        {error && <ValidationError message={error} />}
      </div>
    );
  }

  if (question.type === "select" || question.type === "single-select" || question.type === "boolean") {
    const options =
      question.type === "boolean"
        ? [
            { label: "Yes", value: true },
            { label: "No", value: false },
          ]
        : (question.options ?? []);
    const groupLabel = `${question.prompt}${question.required !== false ? " (required)" : ""}`;

    return (
      <Card className="min-w-0 p-5 sm:p-6">
        <fieldset>
          <legend className="font-bold">{groupLabel}</legend>
          {(helperOverride ?? question.helperText) && <p className="mt-1 text-sm leading-6 text-muted">{helperOverride ?? question.helperText}</p>}
          {whyWeAsk && <p className="mt-3 rounded-2xl border border-border bg-soft/40 px-4 py-3 text-sm leading-6 text-muted"><span className="font-semibold text-ink">Why we ask this:</span> {whyWeAsk}</p>}
          <div className="mt-4 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label={groupLabel}>
            {options.map((option) => (
              <button
                key={String(option.value)}
                type="button"
                aria-pressed={value === option.value}
                onClick={() => onChange(option.value)}
                className={`min-h-11 min-w-0 rounded-xl border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
                  value === option.value
                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                    : "border-border bg-white text-muted hover:border-primary/30"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
        {error && <ValidationError message={error} />}
      </Card>
    );
  }

  return (
    <Card className="min-w-0 p-5 sm:p-6">
      <label htmlFor={question.id} className="font-bold">
        {question.prompt}
      </label>
      {(helperOverride ?? question.helperText) && <p className="mt-1 text-sm leading-6 text-muted">{helperOverride ?? question.helperText}</p>}
      {whyWeAsk && <p className="mt-3 rounded-2xl border border-border bg-soft/40 px-4 py-3 text-sm leading-6 text-muted"><span className="font-semibold text-ink">Why we ask this:</span> {whyWeAsk}</p>}
      <textarea
        id={question.id}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        maxLength={question.validation?.maxLength}
        aria-invalid={Boolean(error)}
        className="mt-4 w-full min-w-0 resize-y rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
        placeholder="Add optional context…"
      />
      {error && <ValidationError message={error} />}
    </Card>
  );
}
