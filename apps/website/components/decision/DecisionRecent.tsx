"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { Card } from "@datastorified/ui";
import { localDecisionStorage, decisionPluginRegistry, type StoredDecision } from "@datastorified/decision-os";

export function DecisionRecent() {
  const [items, setItems] = useState<StoredDecision[]>([]);
  useEffect(() => setItems(localDecisionStorage.listRecent().slice(0, 4)), []);
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <div className="flex items-center gap-2"><Clock3 className="text-primary" /><h2 className="text-2xl font-bold">Recent decisions</h2></div>
      <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const workflow = decisionPluginRegistry.getWorkflow(item.workflowId);
          return <Link key={item.id} href={`/decision/result/${item.id}`} className="min-w-0"><Card className="h-full min-w-0 p-4 transition hover:-translate-y-1 hover:shadow-lift"><p className="text-xs font-bold uppercase tracking-wide text-primary">{item.report?.score.value ?? 0}/100 · {item.report?.score.label ?? "Decision"}</p><h3 className="mt-2 truncate font-bold">{workflow?.title ?? item.workflowId}</h3><span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-muted">Open result <ArrowRight size={14} /></span></Card></Link>;
        })}
      </div>
    </section>
  );
}
