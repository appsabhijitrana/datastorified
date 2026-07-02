"use client";

import { Badge, Card } from "@datastorified/ui";

const CTA_COPY = "Create a free account later to save your profile, sync history, and unlock more accurate decisions.";

export function ImproveAnalysisCTA() {
  return (
    <Card className="min-w-0 border-dashed border-primary/20 bg-primary/[.04] p-5">
      <Badge className="inline-flex">Future-ready</Badge>
      <p className="mt-3 text-sm font-semibold uppercase tracking-[.14em] text-primary">Improve analysis</p>
      <p className="mt-2 text-sm leading-6 text-muted">{CTA_COPY}</p>
    </Card>
  );
}
