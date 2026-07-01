import { ShieldCheck } from "lucide-react";

export function DecisionAccuracyBadge({ label = "Transparent model" }: { label?: string }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-success/15 bg-success/[.07] px-3 py-1.5 text-xs font-bold text-success"><ShieldCheck size={14} />{label}</span>;
}
