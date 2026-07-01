"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Card } from "@datastorified/ui";
import { SmartNumberInput } from "@datastorified/ui/smart-number-input";
import { buildDecisionReport, type DecisionAnswers, type DecisionReport, type DecisionWorkflow } from "@datastorified/decision-os";

export function DecisionScenarioSimulator({ workflow, answers, baseReport }: { workflow: DecisionWorkflow; answers: DecisionAnswers; baseReport: DecisionReport }) {
  const variables = workflow.questions.filter((question) => ["currency", "percentage", "number", "duration", "slider"].includes(question.type)).slice(0, 3);
  const [changes, setChanges] = useState<DecisionAnswers>({});
  const scenarioReport = useMemo(() => buildDecisionReport(workflow, { ...answers, ...changes }), [answers, changes, workflow]);
  const delta = Math.round((scenarioReport.score.value - baseReport.score.value) * 10) / 10;
  if (!variables.length) return null;
  return <Card className="min-w-0 p-5 sm:p-6"><div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><SlidersHorizontal size={19} /></span><div><h2 className="text-xl font-bold">What-if simulator</h2><p className="mt-1 text-sm text-muted">Change a key assumption and see the score react.</p></div></div><div className="mt-6 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_240px]"><div className="grid min-w-0 gap-4 sm:grid-cols-2">{variables.map((question) => <SmartNumberInput key={question.id} compact label={question.prompt} mode={question.type === "currency" ? "currency" : question.type === "percentage" ? "percentage" : question.type === "duration" ? "years" : "decimal"} value={typeof (changes[question.id] ?? answers[question.id]) === "number" ? Number(changes[question.id] ?? answers[question.id]) : null} min={question.validation?.min} max={question.validation?.max} step={question.step} showSlider onChange={(result) => result.numericValue !== null && setChanges((current) => ({ ...current, [question.id]: result.numericValue }))} actions={["reset"]} />)}</div><div className="flex flex-col justify-center rounded-3xl bg-soft p-6 text-center"><p className="text-xs font-bold uppercase tracking-[.14em] text-muted">Scenario score</p><p className="mt-2 text-5xl font-bold text-primary">{Math.round(scenarioReport.score.value)}</p><p className={`mt-3 text-sm font-bold ${delta >= 0 ? "text-success" : "text-warning"}`}>{delta === 0 ? "No score change" : `${delta > 0 ? "+" : ""}${delta} points`}</p></div></div></Card>;
}
