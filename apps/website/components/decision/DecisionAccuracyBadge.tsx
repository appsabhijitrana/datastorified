import { ShieldCheck } from "lucide-react";
import type { ProfileAnalysis } from "@datastorified/profile";

export function DecisionAccuracyBadge({
  label,
  analysis,
}: {
  label?: string;
  analysis?: Pick<ProfileAnalysis, "label" | "percentage" | "level">;
}) {
  const resolvedLabel = label ?? analysis?.label ?? "Basic Analysis";
  const detail = analysis ? (analysis.level === "basic" ? "anonymous" : `${Math.round(analysis.percentage)}% profile`) : undefined;
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-success/15 bg-success/[.07] px-3 py-1.5 text-xs font-bold text-success">
      <ShieldCheck size={14} />
      <span className="truncate">{resolvedLabel}</span>
      {detail && <span className="hidden text-[11px] font-semibold text-success/80 sm:inline">{detail}</span>}
    </span>
  );
}
