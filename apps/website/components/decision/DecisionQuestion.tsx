"use client";

import type { DecisionQuestion as Question, DecisionValue } from "@datastorified/decision-os";
import { SmartNumberInput } from "@datastorified/ui/smart-number-input";
import { Card } from "@datastorified/ui";

export function DecisionQuestion({ question, value, onChange, error }: { question: Question; value: DecisionValue | undefined; onChange: (value: DecisionValue) => void; error?: string }) {
  const numeric = ["currency", "percentage", "number", "duration", "slider"].includes(question.type);
  if (numeric) {
    const mode = question.type === "currency" ? "currency" : question.type === "percentage" ? "percentage" : question.type === "duration" ? "years" : "decimal";
    return <div className="min-w-0"><SmartNumberInput compact id={question.id} label={question.prompt} description={question.helperText} mode={mode} value={typeof value === "number" ? value : null} min={question.validation?.min} max={question.validation?.max} step={question.step} required={question.required} showSlider={question.type === "slider"} showStepper={question.type === "duration"} showWords={question.type === "currency"} onChange={(result) => result.numericValue !== null && onChange(result.numericValue)} actions={["reset"]} defaultValue={typeof question.defaultValue === "number" ? question.defaultValue : null} />{error && <p className="mt-2 text-sm font-semibold text-danger">{error}</p>}</div>;
  }
  if (question.type === "select" || question.type === "single-select" || question.type === "boolean") {
    const options = question.type === "boolean" ? [{ label: "Yes", value: true }, { label: "No", value: false }] : question.options ?? [];
    return <Card className="min-w-0 p-5 sm:p-6"><p className="font-bold">{question.prompt}</p>{question.helperText && <p className="mt-1 text-sm leading-6 text-muted">{question.helperText}</p>}<div className="mt-4 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3">{options.map((option) => <button type="button" key={String(option.value)} onClick={() => onChange(option.value)} className={`min-h-11 min-w-0 rounded-xl border px-3 text-sm font-semibold transition ${value === option.value ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-border bg-white text-muted hover:border-primary/30"}`}>{option.label}</button>)}</div>{error && <p className="mt-3 text-sm font-semibold text-danger">{error}</p>}</Card>;
  }
  return <Card className="min-w-0 p-5 sm:p-6"><label htmlFor={question.id} className="font-bold">{question.prompt}</label>{question.helperText && <p className="mt-1 text-sm leading-6 text-muted">{question.helperText}</p>}<textarea id={question.id} value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} rows={4} maxLength={question.validation?.maxLength} className="mt-4 w-full min-w-0 resize-y rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" placeholder="Add optional context…" />{error && <p className="mt-2 text-sm font-semibold text-danger">{error}</p>}</Card>;
}
