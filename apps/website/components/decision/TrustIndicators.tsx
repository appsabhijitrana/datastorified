"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, CloudOff, RefreshCw, Save, WifiOff } from "lucide-react";
import { Card, Button } from "@datastorified/ui";

export function AutosaveIndicator({
  status,
  updatedAt,
  syncState = "idle",
  onRetry,
}: {
  status: "saving" | "saved" | "error" | "idle";
  updatedAt?: string;
  syncState?: "idle" | "pending" | "failed";
  onRetry?: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const label = useMemo(() => {
    if (status === "saving") return "Saving…";
    if (status === "error") return "Sync failed - retry";
    if (syncState === "failed") return "Sync failed - retry";
    if (syncState === "pending") return "Sync pending";
    if (!updatedAt) return "Saved locally";
    const diff = Math.max(0, Math.floor((now - new Date(updatedAt).getTime()) / 1000));
    if (diff < 5) return "Saved just now";
    if (diff < 15) return `Saved ${diff} sec ago`;
    return "Offline - saved locally";
  }, [now, status, syncState, updatedAt]);

  const icon = status === "saving" ? <RefreshCw size={14} className="animate-spin" /> : syncState === "failed" || status === "error" ? <WifiOff size={14} /> : syncState === "pending" ? <CloudOff size={14} /> : <Save size={14} />;

  return (
    <div className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-white px-3 text-xs font-semibold text-muted shadow-soft">
      {icon}
      <span>{label}</span>
      {onRetry && (status === "error" || syncState === "failed") && (
        <Button variant="ghost" className="min-h-8 px-2 text-xs font-semibold text-primary" onClick={onRetry}>Retry</Button>
      )}
    </div>
  );
}

export function DraftSavedToast({ open, message = "Draft saved locally." }: { open: boolean; message?: string }) {
  if (!open) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex justify-center px-4 md:bottom-6">
      <Card className="pointer-events-auto inline-flex items-center gap-2 rounded-full border-primary/15 bg-primary/[.06] px-4 py-3 text-sm font-semibold text-ink shadow-lift">
        <CheckCircle2 size={16} className="text-success" />
        {message}
      </Card>
    </div>
  );
}

export function ResumeDecisionBanner({
  title,
  description = "Your draft is still here. Pick up where you left off.",
  href,
}: {
  title: string;
  description?: string;
  href: string;
}) {
  return (
    <Card className="border-primary/15 bg-primary/[.04] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Resume decision</p>
          <h3 className="mt-2 text-lg font-bold">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        </div>
        <Link href={href} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent px-4 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5">
          Resume
        </Link>
      </div>
    </Card>
  );
}

export function DecisionTimelineMini({
  events,
}: {
  events: Array<{ label: "Started" | "Draft saved" | "Updated" | "Completed" | "Synced"; at?: string }>;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <Clock3 size={16} className="text-primary" />
        <p className="text-sm font-bold uppercase tracking-[.14em] text-primary">Decision timeline</p>
      </div>
      <div className="mt-4 space-y-3">
        {events.map((event) => (
          <div key={`${event.label}:${event.at ?? ""}`} className="flex items-start gap-3">
            <span className="mt-1 size-2.5 rounded-full bg-primary" />
            <div>
              <p className="text-sm font-semibold">{event.label}</p>
              {event.at && <p className="text-xs text-muted">{new Date(event.at).toLocaleString("en-IN")}</p>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function useAutosaveTrustLabel(updatedAt?: string) {
  const [label, setLabel] = useState("Saved locally");
  useEffect(() => {
    if (!updatedAt) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(updatedAt).getTime()) / 1000));
      setLabel(diff < 5 ? "Saved just now" : diff < 15 ? `Saved ${diff} sec ago` : "Offline - saved locally");
    };
    tick();
    const timer = window.setInterval(tick, 5000);
    return () => window.clearInterval(timer);
  }, [updatedAt]);
  return label;
}
