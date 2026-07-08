"use client";

import { CalendarClock, CheckCircle2, FileText, ListChecks, ShieldCheck } from "lucide-react";
import { Button, Card } from "@datastorified/ui";
import type { DecisionReport, DecisionWorkflow } from "@datastorified/decision-os";
import { ResultSectionLayout } from "./ResultSectionLayout";
import { safeCopyForType } from "./ResultDataAdapter";

export function ActionPlanSection({
  workflow,
  report,
  disclaimerType = "none",
  onSaveChecklist,
}: {
  workflow: DecisionWorkflow;
  report: DecisionReport;
  disclaimerType?: "none" | "finance" | "insurance" | "legal" | "health";
  onSaveChecklist?: () => void;
}) {
  const checklist = buildChecklist(workflow, report);
  const verifyItems = buildVerifyItems(workflow, report);
  const optionalSteps = buildOptionalSteps(workflow, report);
  const documents = buildDocuments(workflow, report);
  const timeline = buildTimeline(workflow, report);

  return (
    <ResultSectionLayout
      title="Action plan"
      kicker="Before you decide"
      description="A practical, educational checklist that helps you verify assumptions without giving direct advice."
      className="mt-8"
      aside={
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-primary" />
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Safe reminder</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">
            {safeCopyForType(disclaimerType)}
          </p>
        </Card>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <VerifyBeforeActingCard
          items={verifyItems}
          fallback={["Before acting on this decision, verify assumptions and compare official terms."]}
        />
        <DocumentsNeededCard
          items={documents}
          fallback={["Official terms or policy details", "A copy of your current assumptions", "Any deadlines or expiry dates"]}
        />
        <TimelineCard
          label={timeline.label}
          description={timeline.description}
          fallback="Review the result again after you verify the key assumptions."
        />
        <ReminderCTA
          title="Save this checklist"
          description="Keep a local copy of the next steps so you can revisit them before acting."
          onSaveChecklist={onSaveChecklist}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <ActionChecklist items={checklist} />
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Optional next steps</p>
          <div className="mt-4 space-y-3">
            {optionalSteps.map((step, index) => (
              <div key={`${step}:${index}`} className="rounded-2xl border border-border bg-soft/40 p-4">
                <p className="text-sm leading-6 text-muted">{step}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </ResultSectionLayout>
  );
}

export function ActionChecklist({ items }: { items: string[] }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <ListChecks size={16} className="text-primary" />
        <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Action checklist</p>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item, index) => (
          <div key={`${item}:${index}`} className="flex gap-3 rounded-2xl bg-soft p-3">
            <CheckCircle2 className="mt-0.5 shrink-0 text-primary" size={18} />
            <div className="min-w-0">
              <span className="text-xs font-bold text-primary">STEP {index + 1}</span>
              <p className="mt-1 text-sm leading-6 text-ink">{item}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function VerifyBeforeActingCard({ items, fallback }: { items: string[]; fallback: string[] }) {
  const resolved = items.length ? items : fallback;
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck size={16} className="text-primary" />
        <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Things to verify</p>
      </div>
      <div className="mt-4 space-y-3">
        {resolved.map((item, index) => (
          <div key={`${item}:${index}`} className="rounded-2xl border border-border bg-white p-4">
            <p className="text-sm leading-6 text-muted">{normalizeSafeCopy(item)}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function DocumentsNeededCard({ items, fallback }: { items: string[]; fallback: string[] }) {
  const resolved = items.length ? items : fallback;
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <FileText size={16} className="text-primary" />
        <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Documents to collect</p>
      </div>
      <div className="mt-4 space-y-3">
        {resolved.map((item, index) => (
          <div key={`${item}:${index}`} className="rounded-2xl border border-border bg-white p-4">
            <p className="text-sm leading-6 text-muted">{normalizeSafeCopy(item)}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function TimelineCard({ label, description, fallback }: { label: string; description: string; fallback: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <CalendarClock size={16} className="text-primary" />
        <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Suggested review timeline</p>
      </div>
      <h3 className="mt-3 text-lg font-bold text-ink">{label}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{description || fallback}</p>
      <p className="mt-3 rounded-2xl bg-soft px-3 py-2 text-xs font-semibold text-muted">
        {fallback}
      </p>
    </Card>
  );
}

export function ReminderCTA({
  title,
  description,
  onSaveChecklist,
}: {
  title: string;
  description: string;
  onSaveChecklist?: () => void;
}) {
  return (
    <Card className="flex h-full flex-col justify-between p-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Reminder</p>
        <h3 className="mt-2 text-lg font-bold text-ink">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={onSaveChecklist}>
          Save checklist locally
        </Button>
      </div>
    </Card>
  );
}

function buildChecklist(workflow: DecisionWorkflow, report: DecisionReport): string[] {
  const configured = workflow.actionPlanTemplates?.flatMap((template) => template.actions) ?? [];
  const reportPlan = report.actionPlan ?? [];
  const merged = [...configured, ...reportPlan];
  const safe = merged.length ? merged : [
    "Before acting on this decision, verify assumptions and compare official terms.",
    "Recheck the most important inputs one more time.",
    "Keep a note of the key risks and review timing.",
  ];
  return safe.slice(0, 5).map(normalizeSafeCopy);
}

function buildVerifyItems(workflow: DecisionWorkflow, report: DecisionReport): string[] {
  const risks = report.risks.map((risk) => risk.mitigation ?? risk.description);
  const recommendationHints = report.recommendation?.actions ?? [];
  const workflowHints = workflow.assumptions ?? [];
  return [...risks, ...recommendationHints, ...workflowHints]
    .filter(Boolean)
    .map((item) => normalizeSafeCopy(item))
    .slice(0, 4);
}

function buildOptionalSteps(workflow: DecisionWorkflow, report: DecisionReport): string[] {
  const steps = report.actionPlan.length ? report.actionPlan : workflow.actionPlanTemplates?.[0]?.actions ?? [];
  const fallback = [
    "Compare the result with the official terms or product details.",
    "Note any assumptions that feel uncertain and revisit them later.",
    "Check whether your priorities changed before taking action.",
  ];
  return [...steps, ...fallback].map(normalizeSafeCopy).slice(0, 4);
}

function buildDocuments(workflow: DecisionWorkflow, report: DecisionReport): string[] {
  const docs = [
    ...workflow.questions.slice(0, 3).map((question) => question.prompt),
    ...(report.recommendation?.actions ?? []),
  ];
  return docs.length ? docs.map((item) => `Keep a note of: ${item}`) : ["Keep a note of the official terms.", "Keep a copy of the latest inputs.", "Keep any deadlines or approvals together."];
}

function buildTimeline(workflow: DecisionWorkflow, report: DecisionReport) {
  const explicit = workflow.actionPlanTemplates?.[0]?.actions?.length ?? 0;
  if (explicit > 0) {
    return {
      label: "Review within 1-2 days",
      description: "A short review window helps you verify assumptions and compare the official details before acting.",
    };
  }
  if (report.risks.length > 0) {
    return {
      label: "Review before acting",
      description: "This result has open risks, so a fresh review after verification is the safest next step.",
    };
  }
  return {
    label: "Review within a week",
    description: "If nothing material changes, revisit the decision soon so the result stays relevant.",
  };
}

function normalizeSafeCopy(text: string): string {
  return text
    .replace(/\binvest now\b/giu, "review now")
    .replace(/\bbuy this\b/giu, "review this")
    .replace(/\bsell this\b/giu, "review this")
    .replace(/\bmust\b/giu, "may")
    .replace(/\bshould\b/giu, "may")
    .replace(/\brecommend(?:ed|s)?\b/giu, "appears aligned");
}
