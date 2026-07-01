export function DecisionProgress({ value, current, total }: { value: number; current?: number; total?: number }) {
  const bounded = Math.max(0, Math.min(100, Math.round(value)));
  return <div aria-label={`Decision progress ${bounded}%`}><div className="flex items-center justify-between text-xs font-semibold text-muted"><span>{current && total ? `Question ${current} of ${total}` : "Decision profile"}</span><span>{bounded}% complete</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-primary/10"><div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-300" style={{ width: `${bounded}%` }} /></div></div>;
}
