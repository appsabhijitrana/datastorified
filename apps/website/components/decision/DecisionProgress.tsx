export function DecisionProgress({ value, current, total }: { value: number; current?: number; total?: number }) {
  const bounded = Math.max(0, Math.min(100, Math.round(value)));
  const label = current && total ? `Question ${current} of ${total}, ${bounded}% complete` : `Decision profile ${bounded}% complete`;

  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold text-muted">
        <span>{current && total ? `Question ${current} of ${total}` : "Decision profile"}</span>
        <span>{bounded}% complete</span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-primary/10"
        role="progressbar"
        aria-valuenow={bounded}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-300" style={{ width: `${bounded}%` }} />
      </div>
    </div>
  );
}
