import React from "react";
import { Clock3 } from "lucide-react";
import { Card } from "@datastorified/ui";

export function ScheduledMaintenanceBanner({ message }: { message: string }) {
  return (
    <div className="border-b border-border bg-soft/40 px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-start gap-3 rounded-2xl border border-border bg-white/80 px-4 py-3 shadow-soft backdrop-blur">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-soft text-muted">
          <Clock3 size={16} />
        </span>
        <Card className="border-0 bg-transparent p-0 shadow-none">
          <p className="text-sm font-semibold text-ink">Planned maintenance</p>
          <p className="mt-1 text-sm leading-6 text-muted">{message}</p>
        </Card>
      </div>
    </div>
  );
}
