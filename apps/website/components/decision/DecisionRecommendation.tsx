import { Sparkles } from "lucide-react";
import { Card } from "@datastorified/ui";
import type { DecisionRecommendation as Recommendation } from "@datastorified/decision-os";

export function DecisionRecommendation({ recommendation }: { recommendation: Recommendation }) {
  return <Card className="min-w-0 border-primary/15 bg-gradient-to-br from-primary/[.06] to-accent/[.08] p-6"><div className="flex gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white"><Sparkles size={19} /></span><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Recommendation</p><h2 className="mt-1 text-balance text-2xl font-bold">{recommendation.title}</h2></div></div><p className="mt-4 leading-7 text-muted">{recommendation.summary}</p></Card>;
}
