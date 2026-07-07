"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { buildDecisionReport, decisionPluginRegistry } from "@datastorified/decision-os";
import { DecisionOrchestrator, type DecisionOrchestratorRepositoryDecision } from "@datastorified/decision-os/core/orchestrator";
import { getProfileAnalysis, type DecisionProfileEnvelope } from "@datastorified/profile";
import { getDecisionAdapters } from "@datastorified/decision-os/adapters";
import { authClient } from "@datastorified/auth";
import { HybridDecisionRepository } from "@datastorified/decision-repository";
import type { DecisionRepositoryDecision } from "@datastorified/decision-repository";
import { ResultRenderer } from "./ResultRenderer";
import { ResultEmptyState, ResultErrorState } from "./ResultStates";

export function DecisionResultPage({ id }: { id: string }) {
  const router = useRouter();
  const adapters = getDecisionAdapters();
  const { data: session } = authClient.useSession();
  const repository = useMemo(() => new HybridDecisionRepository({ authenticated: Boolean(session?.user) }), [session?.user]);
  const orchestrator = useMemo(() => new DecisionOrchestrator({ repository }), [repository]);
  const [item, setItem] = useState<DecisionRepositoryDecision | null | undefined>(undefined);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState<DecisionProfileEnvelope | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    setItem(undefined);
    setFetchError(null);
    void orchestrator
      .getDecision(id)
      .then((decision) => {
        setItem(decision ?? null);
        setSaved(Boolean(decision));
      })
      .catch(() => {
        setItem(null);
        setFetchError("Could not load this decision result.");
      });
  }, [id, orchestrator]);

  useEffect(() => {
    void adapters.profile.getProfile().then(setProfile);
  }, [adapters.profile]);

  const workflow = item ? decisionPluginRegistry.getWorkflow(item.workflowId) : undefined;
  const report = useMemo(
    () => (item && workflow ? item.report ?? buildDecisionReport(workflow, item.answers, { generatedAt: item.updatedAt }) : undefined),
    [item, workflow],
  );
  const profileAnalysis = useMemo(() => getProfileAnalysis(profile?.profile), [profile]);

  if (item === undefined) {
    return (
      <main className="px-4 py-24" aria-busy="true" aria-label="Loading decision result">
        <div className="mx-auto h-40 max-w-xl animate-pulse rounded-3xl bg-soft" />
      </main>
    );
  }

  if (fetchError) {
    return (
      <main className="px-4 py-24">
        <ResultErrorState
          title="Could not load this result"
          description={fetchError}
          actionLabel="Open saved decisions"
          actionHref="/decision/saved"
        />
      </main>
    );
  }

  if (!item || !workflow || !report) {
    return (
      <main className="px-4 py-24">
        <ResultEmptyState />
      </main>
    );
  }

  const summary = `${workflow.title}\nScore: ${Math.round(report.score.value)}/100 — ${report.score.label ?? "Decision profile"}\nRecommendation: ${report.recommendation?.title ?? "Review the result"}\n${report.recommendation?.summary ?? ""}\nNext: ${report.actionPlan[0] ?? "Review assumptions"}`;
  const copy = async () => {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };
  const share = async () => {
    if (navigator.share) await navigator.share({ title: workflow.title, text: summary, url: window.location.href });
    else await copy();
  };
  const saveLocally = async () => {
    try {
      await orchestrator.saveDecisionRecord({
        ...item,
        workflow,
        plugin: decisionPluginRegistry.getPlugin(workflow.pluginId) ?? item.plugin,
        report,
        question: item.question ?? workflow.title,
        score: item.score,
        confidence: item.confidence,
        riskLevel: item.riskLevel,
        recommendation: item.recommendation,
        actionPlan: item.actionPlan,
        assumptions: item.assumptions,
      } as DecisionOrchestratorRepositoryDecision);
      setSaved(true);
    } catch {
      // Keep the current result visible; local save may be unavailable.
    }
  };
  const deleteSaved = async () => {
    try {
      await orchestrator.deleteDecision(item.id);
      setSaved(false);
    } catch {
      // Keep the current result visible; deletion failed locally.
    }
  };

  return (
    <ResultRenderer
      workflow={workflow}
      report={report}
      answers={item.answers}
      saved={saved}
      copied={copied}
      profileAnalysis={profileAnalysis}
      onCopy={copy}
      onShare={share}
      onPrint={() => window.print()}
      onRevisit={() => router.push(`/decision/${workflow.pluginId}/${workflow.slug}`)}
      onSave={saved ? deleteSaved : saveLocally}
      config={{ workflowId: workflow.id, disclaimerType: "none" }}
    />
  );
}
