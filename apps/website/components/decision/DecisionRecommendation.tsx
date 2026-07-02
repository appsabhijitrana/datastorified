import { Sparkles } from "lucide-react";
import { Card } from "@datastorified/ui";
import type { DecisionRecommendation as Recommendation } from "@datastorified/decision-os";
import type { ProfileAnalysis } from "@datastorified/profile";

export function DecisionRecommendation({ recommendation, analysis, note }: { recommendation: Recommendation; analysis?: Pick<ProfileAnalysis, "label" | "description" | "nextBestField" | "percentage">; note?: string }) {
  return (
    <Card className="min-w-0 border-primary/15 bg-gradient-to-br from-primary/[.06] to-accent/[.08] p-6">
      <div className="flex gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white">
          <Sparkles size={19} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Recommendation</p>
          <h2 className="mt-1 text-balance text-2xl font-bold">{recommendation.title}</h2>
        </div>
      </div>
      <p className="mt-4 leading-7 text-muted">{recommendation.summary}</p>
      {analysis && (
        <div className="mt-4 rounded-2xl border border-success/15 bg-white/75 p-4">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-success">{analysis.label}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{analysis.description}</p>
          {analysis.nextBestField && (
            <p className="mt-2 text-sm font-medium text-ink">
              Next best field: <span className="text-primary">{analysis.nextBestField.label}</span>
            </p>
          )}
        </div>
      )}
      {note && <p className="mt-4 rounded-2xl border border-border bg-white p-4 text-sm leading-6 text-muted">{note}</p>}
    </Card>
  );
}
