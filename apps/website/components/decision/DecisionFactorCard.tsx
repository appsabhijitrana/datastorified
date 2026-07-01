import { Card } from "@datastorified/ui";
import type { DecisionFactorScore } from "@datastorified/decision-os";

export function DecisionFactorCard({ factor }: { factor: DecisionFactorScore }) {
  const tone = factor.score >= 65 ? "text-success" : factor.score >= 40 ? "text-warning" : "text-danger";
  return <Card className="min-w-0 p-4"><div className="flex justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-bold">{factor.label}</h3><p className="mt-1 text-xs text-muted">Weight {Math.round(factor.normalizedWeight * 100)}% · contributes {factor.contribution}</p></div><span className={`shrink-0 text-xl font-bold ${tone}`}>{Math.round(factor.score)}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-soft"><div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${factor.score}%` }} /></div></Card>;
}
