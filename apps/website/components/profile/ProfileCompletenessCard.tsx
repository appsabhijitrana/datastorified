"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { Button, Card } from "@datastorified/ui";
import type { ProfileAnalysis } from "@datastorified/profile";

export function ProfileCompletenessCard({ analysis }: { analysis: ProfileAnalysis }) {
  const tone = analysis.level === "advanced" ? "text-success" : analysis.level === "better" ? "text-primary" : "text-muted";
  return (
    <Card className="min-w-0 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Profile completeness</p>
          <h3 className="mt-1 text-xl font-bold">{Math.round(analysis.percentage)}% complete</h3>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${tone} border-current/15 bg-current/[.06]`}>
          <Sparkles size={14} />
          {analysis.label}
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-soft">
        <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-300" style={{ width: `${Math.min(100, Math.max(0, analysis.percentage))}%` }} />
      </div>
      <p className="mt-4 text-sm leading-6 text-muted">{analysis.description}</p>
      {analysis.nextBestField && (
        <div className="mt-4 rounded-2xl border border-border bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-muted">Next best field</p>
          <p className="mt-1 font-semibold">{analysis.nextBestField.label}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{analysis.nextBestField.description}</p>
        </div>
      )}
      <Button className="mt-4 w-full sm:w-auto" variant="secondary" type="button">
        Review profile later <ArrowRight size={16} />
      </Button>
    </Card>
  );
}
