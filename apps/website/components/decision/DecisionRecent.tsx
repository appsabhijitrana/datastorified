"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { Card } from "@datastorified/ui";
import { decisionPluginRegistry, type StoredDecision } from "@datastorified/decision-os";
import { DecisionOrchestrator } from "@datastorified/decision-os/core/orchestrator";
import { authClient } from "@datastorified/auth";
import { HybridDecisionRepository } from "@datastorified/decision-repository";

export function DecisionRecent() {
  const { data: session } = authClient.useSession();
  const repository = useMemo(() => new HybridDecisionRepository({ authenticated: Boolean(session?.user) }), [session?.user]);
  const orchestrator = useMemo(() => new DecisionOrchestrator({ repository }), [repository]);
  const [items, setItems] = useState<StoredDecision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void orchestrator
      .listRecentDecisions()
      .then((recent) => {
        if (!cancelled) setItems(recent.slice(0, 4));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orchestrator]);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6" aria-busy="true" aria-label="Loading recent decisions">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-soft" />
        <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <Card key={index} className="h-32 animate-pulse rounded-2xl bg-soft" />
          ))}
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <div className="flex items-center gap-2">
        <Clock3 className="text-primary" aria-hidden="true" />
        <h2 className="text-2xl font-bold">Recent decisions</h2>
      </div>
      <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const workflow = decisionPluginRegistry.getWorkflow(item.workflowId);
          return (
            <Link key={item.id} href={`/decision/result/${item.id}`} className="min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20">
              <Card className="h-full min-w-0 p-4 transition hover:-translate-y-1 hover:shadow-lift">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  {item.report?.score.value ?? 0}/100 · {item.report?.score.label ?? "Decision"}
                </p>
                <h3 className="mt-2 truncate font-bold">{workflow?.title ?? item.workflowId}</h3>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-muted">
                  Open result <ArrowRight size={14} aria-hidden="true" />
                </span>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
