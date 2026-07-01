import { Gauge, ShieldCheck } from "lucide-react";
import { Card } from "@datastorified/ui";
import type { DecisionScore } from "@datastorified/decision-os";

export function DecisionScoreCard({ score, compact = false }: { score: DecisionScore; compact?: boolean }) {
  const tone = score.value >= 65 ? "text-success" : score.value >= 40 ? "text-warning" : "text-danger";
  return <Card className={`min-w-0 overflow-hidden bg-gradient-to-br from-primary/[.06] to-accent/[.08] ${compact ? "p-4" : "p-5 sm:p-6"}`}><div className="flex items-center gap-4"><div className="relative grid size-24 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#2563EB ${score.value * 3.6}deg, #E5E7EB 0deg)` }}><div className="grid size-[72px] place-items-center rounded-full bg-white"><span className={`text-2xl font-bold ${tone}`}>{Math.round(score.value)}</span></div></div><div className="min-w-0"><p className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[.14em] text-primary"><Gauge size={14} /> Live score</p><h2 className="mt-1 truncate text-xl font-bold">{score.label ?? "Decision profile"}</h2><p className="mt-1 inline-flex items-center gap-1 text-sm text-muted"><ShieldCheck size={14} /> Rules and weights are inspectable</p></div></div></Card>;
}
