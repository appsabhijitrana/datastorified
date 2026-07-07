import React from "react";
import { AlertTriangle } from "lucide-react";
import { Card } from "@datastorified/ui";

export function MaintenanceBanner({ message }: { message: string }) {
  return (
    <div className="border-b border-primary/15 bg-primary/[.05] px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-start gap-3 rounded-2xl border border-primary/10 bg-white/80 px-4 py-3 shadow-soft backdrop-blur">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <AlertTriangle size={16} />
        </span>
        <Card className="border-0 bg-transparent p-0 shadow-none">
          <p className="text-sm font-semibold text-ink">A short pause is in progress</p>
          <p className="mt-1 text-sm leading-6 text-muted">{message}</p>
        </Card>
      </div>
    </div>
  );
}
