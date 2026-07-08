"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Clock3, AlertTriangle, Bell, Sparkles, CheckCircle2 } from "lucide-react";
import { Button, Card, Dialog } from "@datastorified/ui/design-system";

type ReviewInterval = "1 month" | "3 months" | "6 months" | "1 year" | "custom";

type DecisionReviewReminder = {
  workflowId: string;
  nextReviewAt: string;
  interval: ReviewInterval;
  reason: string;
  updatedAt: string;
};

const STORAGE_KEY = "ds.decision.review.reminders";

function readReminders(): Record<string, DecisionReviewReminder> {
  try {
    if (typeof window === "undefined") return {};
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, DecisionReviewReminder>;
  } catch {
    return {};
  }
}

function writeReminders(next: Record<string, DecisionReviewReminder>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Local-only reminder storage may be unavailable in private modes.
  }
}

export function getDecisionReviewReminder(workflowId: string): DecisionReviewReminder | null {
  if (typeof window === "undefined") return null;
  return readReminders()[workflowId] ?? null;
}

export function setDecisionReviewReminder(workflowId: string, input: Omit<DecisionReviewReminder, "workflowId" | "updatedAt">) {
  const current = readReminders();
  current[workflowId] = {
    ...input,
    workflowId,
    updatedAt: new Date().toISOString(),
  };
  writeReminders(current);
  return current[workflowId];
}

export function removeDecisionReviewReminder(workflowId: string) {
  const current = readReminders();
  delete current[workflowId];
  writeReminders(current);
}

export function useDecisionReviewReminder(workflowId: string) {
  const [reminder, setReminder] = useState<DecisionReviewReminder | null>(null);
  useEffect(() => {
    setReminder(getDecisionReviewReminder(workflowId));
    const onStorage = () => setReminder(getDecisionReviewReminder(workflowId));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [workflowId]);
  return {
    reminder,
    refresh: () => setReminder(getDecisionReviewReminder(workflowId)),
  };
}

export function ReviewTimelineBadge({ nextReviewAt }: { nextReviewAt?: string }) {
  if (!nextReviewAt) return <Badge tone="muted" icon={<Clock3 size={14} />}>No review set</Badge>;
  return <Badge tone="primary" icon={<CalendarClock size={14} />}>Next review {new Date(nextReviewAt).toLocaleDateString("en-IN")}</Badge>;
}

export function NeedsReviewStatus({ nextReviewAt }: { nextReviewAt?: string }) {
  const isDue = nextReviewAt ? Date.now() >= new Date(nextReviewAt).getTime() : false;
  return isDue ? <Badge tone="warning" icon={<AlertTriangle size={14} />}>Needs review</Badge> : <Badge tone="success" icon={<CheckCircle2 size={14} />}>Reviewed</Badge>;
}

export function ReviewReminderCard({
  workflowId,
  title,
  nextReviewAt,
  reason,
  onOpenSheet,
}: {
  workflowId: string;
  title: string;
  nextReviewAt?: string;
  reason?: string;
  onOpenSheet?: () => void;
}) {
  const hasReminder = Boolean(nextReviewAt);
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Review reminder</p>
          <h3 className="mt-2 text-lg font-bold text-ink">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            {hasReminder ? `Next review: ${new Date(nextReviewAt!).toLocaleDateString("en-IN")}` : "Set a reminder so the decision comes back into view when assumptions may have changed."}
          </p>
        </div>
        {hasReminder ? <ReviewTimelineBadge nextReviewAt={nextReviewAt} /> : <NeedsReviewStatus nextReviewAt={nextReviewAt} />}
      </div>

      <div className="mt-4 grid gap-2 text-sm leading-6 text-muted">
        {reason ? <p>Reason: {reason}</p> : <p>Reasons can include changing assumptions, profile updates, market context, or a saved draft.</p>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onOpenSheet}>
          <Bell size={16} />
          Set reminder
        </Button>
        {hasReminder ? <NeedsReviewStatus nextReviewAt={nextReviewAt} /> : <Badge tone="muted" icon={<Sparkles size={14} />}>Local only</Badge>}
      </div>

      <input type="hidden" data-workflow-id={workflowId} />
    </Card>
  );
}

export function SetReviewReminderSheet({
  open,
  onClose,
  workflowId,
  onSaved,
  title,
}: {
  open: boolean;
  onClose: () => void;
  workflowId: string;
  onSaved?: (reminder: DecisionReviewReminder) => void;
  title: string;
}) {
  const [interval, setInterval] = useState<ReviewInterval>("3 months");
  const [customDate, setCustomDate] = useState("");
  const [reason, setReason] = useState("Assumptions may change");

  useEffect(() => {
    if (!open) return;
    setInterval("3 months");
    setCustomDate("");
    setReason("Assumptions may change");
  }, [open]);

  const nextReviewAt = useMemo(() => computeNextReviewAt(interval, customDate), [customDate, interval]);

  return (
    <Dialog open={open} title="Set review reminder" onClose={onClose}>
      <div className="space-y-4">
        <Card className="border-border bg-soft/40 p-4">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Reminder for</p>
          <p className="mt-2 text-sm font-semibold text-ink">{title}</p>
          <p className="mt-1 text-sm leading-6 text-muted">Store locally first. Sync later if supported by your signed-in account.</p>
        </Card>

        <div className="grid gap-2 sm:grid-cols-2">
          {(["1 month", "3 months", "6 months", "1 year"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={`min-h-11 rounded-2xl border px-4 text-left text-sm font-semibold transition ${interval === value ? "border-primary bg-primary/10 text-primary" : "border-border bg-white text-ink"}`}
              onClick={() => setInterval(value)}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-semibold text-ink">
            Custom later
            <input type="date" value={customDate} onChange={(event) => { setInterval("custom"); setCustomDate(event.target.value); }} className="mt-2 min-h-12 w-full rounded-2xl border border-border bg-white px-4" />
          </label>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {reasonOptions.map((item) => (
            <button
              key={item}
              type="button"
              className={`min-h-11 rounded-2xl border px-4 text-left text-sm font-semibold transition ${reason === item ? "border-primary bg-primary/10 text-primary" : "border-border bg-white text-ink"}`}
              onClick={() => setReason(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Preview</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            {nextReviewAt ? `Next review date: ${new Date(nextReviewAt).toLocaleDateString("en-IN")}` : "Choose a date or interval to set the reminder."}
          </p>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              const reminder = setDecisionReviewReminder(workflowId, { interval, nextReviewAt, reason });
              onSaved?.(reminder);
              onClose();
            }}
            disabled={!nextReviewAt}
          >
            Save reminder
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function computeNextReviewAt(interval: ReviewInterval, customDate: string): string {
  if (interval === "custom" && customDate) return new Date(customDate).toISOString();
  const next = new Date();
  if (interval === "1 month") next.setMonth(next.getMonth() + 1);
  else if (interval === "3 months") next.setMonth(next.getMonth() + 3);
  else if (interval === "6 months") next.setMonth(next.getMonth() + 6);
  else next.setFullYear(next.getFullYear() + 1);
  return next.toISOString();
}

function Badge({ tone, icon, children }: { tone: "primary" | "success" | "warning" | "muted"; icon: React.ReactNode; children: React.ReactNode }) {
  const styles = {
    primary: "border-primary/15 bg-primary/5 text-primary",
    success: "border-success/15 bg-success/10 text-success",
    warning: "border-amber-500/15 bg-amber-500/10 text-amber-700",
    muted: "border-border bg-soft text-muted",
  }[tone];
  return <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-bold ${styles}`}>{icon}{children}</span>;
}

const reasonOptions = [
  "Assumptions may change",
  "Profile changed",
  "Market/rate context changed",
  "Decision was saved as draft",
];
