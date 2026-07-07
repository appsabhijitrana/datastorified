"use client";

import * as React from "react";
import { ArrowRight, BarChart3, Search, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@datastorified/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function Button({ className, variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-gradient-to-br from-primary to-accent text-white shadow-glow hover:-translate-y-0.5",
        variant === "secondary" && "border border-border bg-white text-ink shadow-soft hover:border-primary/30",
        variant === "ghost" && "text-muted hover:bg-soft hover:text-ink",
        variant === "danger" && "bg-danger text-white",
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[1.5rem] border border-border/80 bg-white shadow-soft", className)} {...props} />;
}

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-flex min-h-8 items-center rounded-full border border-primary/10 bg-primary/5 px-3 text-xs font-semibold text-primary", className)} {...props} />;
}

export function Chip({ className, selected, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20",
        selected ? "border-primary/20 bg-primary/8 text-primary shadow-sm" : "border-border bg-white text-ink hover:border-primary/20",
        className,
      )}
      {...props}
    />
  );
}

export function SearchInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn("flex min-h-12 items-center gap-3 rounded-2xl border border-border bg-white px-4 shadow-soft transition focus-within:border-primary/40 focus-within:shadow-glow", className)}>
      <Search className="shrink-0 text-muted" size={18} />
      <input className="min-w-0 flex-1 bg-transparent py-3 text-base outline-none placeholder:text-muted/70 focus-visible:outline-none" {...props} />
      {props.value ? <X className="shrink-0 text-muted" size={18} /> : null}
    </label>
  );
}

export function BottomSheet({ open, title, children, onClose }: { open: boolean; title?: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className={cn("fixed inset-0 z-50", open ? "pointer-events-auto" : "pointer-events-none")}>
      <button aria-label="Close sheet" className={cn("absolute inset-0 bg-ink/35 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={onClose} />
      <div className={cn("absolute inset-x-0 bottom-0 rounded-t-[1.75rem] border-t border-border bg-white p-4 shadow-lift transition-transform", open ? "translate-y-0" : "translate-y-full")}>
        <div className="mx-auto max-w-2xl">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-soft" />
          <div className="flex items-start justify-between gap-3">
            <div>
              {title ? <h2 className="text-lg font-bold">{title}</h2> : null}
            </div>
            <Button variant="ghost" onClick={onClose} aria-label="Close dialog">Close</Button>
          </div>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Dialog({ open, title, children, onClose }: { open: boolean; title?: string; children: React.ReactNode; onClose: () => void }) {
  return open ? (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4">
      <div className="w-full max-w-lg rounded-[1.5rem] border border-border bg-white p-5 shadow-lift">
        <div className="flex items-start justify-between gap-3">
          <div>{title ? <h2 className="text-xl font-bold">{title}</h2> : null}</div>
          <button className="min-h-11 rounded-xl px-3 text-sm font-semibold text-muted hover:bg-soft" onClick={onClose}>Close</button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  ) : null;
}

export function EmptyState({ title = "Nothing here yet", description, action }: { title?: string; description?: string; action?: React.ReactNode }) {
  return (
    <Card className="grid place-items-center gap-4 p-8 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-primary/5 text-primary"><Sparkles size={20} /></span>
      <div>
        <h3 className="text-lg font-bold">{title}</h3>
        {description ? <p className="mt-2 text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {action}
    </Card>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-soft", className)} />;
}

export function ProgressBar({ value, max = 100, label }: { value: number; max?: number; label?: string }) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="space-y-2">
      {label ? <div className="flex items-center justify-between text-sm font-medium text-muted"><span>{label}</span><span>{Math.round(percent)}%</span></div> : null}
      <div className="h-2 overflow-hidden rounded-full bg-soft">
        <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const safe = Math.max(0, Math.min(100, score));
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safe / 100) * circumference;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={radius} className="stroke-border/40" strokeWidth="10" fill="none" />
        <circle cx="50" cy="50" r={radius} className="stroke-primary" strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold">{safe}</div>
        <div className="text-xs font-semibold text-muted">/100</div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: "success" | "warning" | "danger" | "neutral" }) {
  const styles = {
    success: "border-emerald-500/15 bg-emerald-500/10 text-emerald-700",
    warning: "border-amber-500/15 bg-amber-500/10 text-amber-700",
    danger: "border-rose-500/15 bg-rose-500/10 text-rose-700",
    neutral: "border-border bg-soft text-muted",
  }[status];
  return <span className={cn("inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-semibold", styles)}>{status}</span>;
}

export function SectionHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <Badge>{eyebrow}</Badge> : null}
        <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base sm:leading-7">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <header className="space-y-3">
      <h1 className="text-3xl font-bold tracking-[-.035em] sm:text-4xl">{title}</h1>
      {description ? <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">{description}</p> : null}
      {action}
    </header>
  );
}

export function DecisionCard({ title, description, href, meta, action }: { title: string; description: string; href: string; meta?: string; action?: string }) {
  return (
    <Link href={href} className="block h-full">
      <Card className="h-full p-5 transition hover:border-primary/20 hover:shadow-lift">
        {meta ? <Badge>{meta}</Badge> : null}
        <h3 className="mt-3 text-lg font-bold">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
        {action ? <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">{action} <ArrowRight size={16} /></span> : null}
      </Card>
    </Link>
  );
}

export function CategoryCard({ title, description, href }: { title: string; description: string; href: string }) {
  return <DecisionCard title={title} description={description} href={href} meta="Category" action="Explore" />;
}

export function ProfileNudgeCard({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel: string; onAction: () => void }) {
  return (
    <Card className="border-primary/15 bg-gradient-to-br from-primary/[.05] to-accent/[.07] p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-primary shadow-sm"><BarChart3 size={18} /></span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
          <Button className="mt-4" variant="secondary" onClick={onAction}>{actionLabel}</Button>
        </div>
      </div>
    </Card>
  );
}
