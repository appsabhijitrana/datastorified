"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Badge, Button, Card } from "@datastorified/ui";
import { getDecisionAdapters } from "@datastorified/decision-os/adapters";
import { buildPersonalizedRecommendations, type PersonalizationContext as RecommendationContext } from "@datastorified/personalization";
import type { DecisionProfileEnvelope } from "@datastorified/profile";
import { createDataStorifiedClient, type PersonalizationContext, type PersonalizedRecommendationSet } from "@datastorified/sdk";
import { storage } from "@datastorified/storage";
import { DecisionSuggestionCard } from "../decision/DecisionSuggestionCard";
import { ProfileCompletenessCard } from "../profile/ProfileCompletenessCard";
import { ImproveAnalysisCTA } from "../profile/ImproveAnalysisCTA";
import { DecisionAccuracyBadge } from "../decision/DecisionAccuracyBadge";

export function PersonalizedRecommendations({ compact = false, showProfile = true }: { compact?: boolean; showProfile?: boolean }) {
  const adapters = getDecisionAdapters();
  const client = useMemo(() => createDataStorifiedClient(), []);
  const [snapshot, setSnapshot] = useState<PersonalizedRecommendationSet | null>(null);

  useEffect(() => {
    let mounted = true;
    void Promise.all([
      adapters.profile.getProfile(),
      adapters.memory.listRecent(),
      adapters.memory.listSaved(),
      adapters.memory.listHistory(),
    ]).then(([profileEnvelope, recent, saved, history]) => {
      if (!mounted) return;
      const profile = (profileEnvelope as DecisionProfileEnvelope | null)?.profile;
      const context: PersonalizationContext = {
        profile,
        recentDecisions: recent,
        savedDecisions: saved,
        history,
        favoriteWorkflowIds: saved.map((decision) => decision.workflowId),
        recentCalculators: storage.getRecent("calculators"),
        favoriteCalculators: storage.getFavorites("calculators"),
      };
      void client.recommendations.list(context).then((result) => {
        if (!mounted) return;
        if (result.ok) {
          setSnapshot(result.data);
          return;
        }
        setSnapshot(buildPersonalizedRecommendations(context as RecommendationContext) as PersonalizedRecommendationSet);
      });
    });
    return () => {
      mounted = false;
    };
  }, [adapters.memory, adapters.profile, client]);

  const topWorkflows = useMemo(() => snapshot?.workflowRecommendations.slice(0, compact ? 2 : 4) ?? [], [compact, snapshot]);
  if (!snapshot) return <Card className="p-6"><div className="h-32 animate-pulse rounded-3xl bg-soft" /></Card>;

  return (
    <section className="space-y-6">
      <Card className="border-primary/15 bg-gradient-to-br from-primary/[.05] to-accent/[.08] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge className="inline-flex"><Sparkles size={13} className="mr-1" /> Personalized for you</Badge>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">Recommended next moves</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              We rank these with profile completeness, your recent decision history, saved items, calculator activity, goals, and risk profile.
            </p>
          </div>
          <DecisionAccuracyBadge analysis={snapshot.profileAnalysis} />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {snapshot.nextBestActions.map((action) => (
            <Link key={action.id} href={action.href ?? "/decision"} className="rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-muted transition hover:border-primary/30 hover:text-primary">
              {action.title}
            </Link>
          ))}
        </div>
        <div className={`mt-6 grid min-w-0 gap-4 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-4"}`}>
          {topWorkflows.map(({ workflow, score }) => (
            <DecisionSuggestionCard key={workflow.id} workflow={workflow} confidence={Math.min(1, score / 100)} />
          ))}
        </div>
      </Card>

      {showProfile && (
        <div className={`grid min-w-0 gap-4 ${compact ? "lg:grid-cols-2" : "lg:grid-cols-[1.2fr_.8fr]"}`}>
          <ProfileCompletenessCard analysis={snapshot.profileAnalysis} />
          <ImproveAnalysisCTA />
        </div>
      )}

      {showProfile && snapshot.profileRecommendations.length > 0 && (
        <Card className="p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Profile completion recommendations</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {snapshot.profileRecommendations.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-soft/40 p-4">
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{item.description}</p>
                {item.href && (
                  <Link href={item.href} className="mt-3 inline-flex">
                    <Button variant="secondary">Improve analysis <ArrowRight size={16} /></Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </section>
  );
}
