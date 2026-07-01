import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "@datastorified/ui";
import type { DecisionRisk } from "@datastorified/decision-os";

export function DecisionRiskCard({ risk }: { risk?: DecisionRisk }) {
  if (!risk) return <Card className="p-4"><div className="flex gap-3"><CheckCircle2 className="shrink-0 text-success" /><div><h3 className="font-bold">No configured risk triggered</h3><p className="mt-1 text-sm leading-6 text-muted">Keep validating assumptions before acting.</p></div></div></Card>;
  const tone = risk.severity === "critical" || risk.severity === "high" ? "text-danger" : "text-warning";
  return <Card className="min-w-0 p-4"><div className="flex gap-3"><AlertTriangle className={`shrink-0 ${tone}`} size={20} /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{risk.title}</h3><span className={`text-xs font-bold uppercase ${tone}`}>{risk.severity}</span></div><p className="mt-1 text-sm leading-6 text-muted">{risk.description}</p>{risk.mitigation && <p className="mt-2 text-sm font-semibold text-ink">Next safeguard: {risk.mitigation}</p>}</div></div></Card>;
}
