"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock3, History, Trash2 } from "lucide-react";
import { Badge, Button, Card } from "@datastorified/ui";
import { decisionPluginRegistry, type DecisionMemoryDraft } from "@datastorified/decision-os";
import { DecisionOrchestrator } from "@datastorified/decision-os/core/orchestrator";
import { getDecisionAdapters } from "@datastorified/decision-os/adapters";
import { authClient, GoogleSignInButton, LegalAcceptanceGate } from "@datastorified/auth";
import { HybridDecisionRepository } from "@datastorified/decision-repository";
import type { DecisionRepositoryDecision } from "@datastorified/decision-repository";

export function DecisionSavedPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const repository = useMemo(() => new HybridDecisionRepository({ authenticated: Boolean(session?.user) }), [session?.user]);
  const orchestrator = useMemo(() => new DecisionOrchestrator({ repository }), [repository]);
  const adapters = getDecisionAdapters();
  const [saved, setSaved] = useState<DecisionRepositoryDecision[]>([]);
  const [drafts, setDrafts] = useState<DecisionMemoryDraft[]>([]);
  const [lastOpenedWorkflow, setLastOpenedWorkflow] = useState<DecisionMemoryDraft["workflowId"] | null>(null);
  const [profileLastOpenedWorkflow, setProfileLastOpenedWorkflow] = useState<DecisionMemoryDraft["workflowId"] | null>(null);

  const refresh = useCallback(() => {
    void Promise.all([
      orchestrator.listSavedDecisions(),
      orchestrator.listDrafts(),
    ]).then(([savedItems, draftItems]) => {
      setSaved(savedItems);
      setDrafts(draftItems);
      setLastOpenedWorkflow(draftItems[0]?.workflowId ?? null);
    });
  }, [orchestrator]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    void adapters.memory.getProfile().then((profile) => {
      setProfileLastOpenedWorkflow(profile.lastOpenedWorkflow?.workflowId ?? null);
    });
  }, [adapters.memory]);

  const lastWorkflow = useMemo(() => {
    const workflowId = profileLastOpenedWorkflow ?? lastOpenedWorkflow;
    if (!workflowId) return undefined;
    return decisionPluginRegistry.getWorkflow(workflowId);
  }, [lastOpenedWorkflow, profileLastOpenedWorkflow]);
  const storageLabel = session?.user ? "Synced memory" : "Local memory";
  const storageDescription = session?.user
    ? "Saved decisions sync to your account, while drafts still stay on this device."
    : "Your decision is saved on this device. Resume drafts, revisit saved results, and continue where you left off.";

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge>{storageLabel}</Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-[-.035em] sm:text-4xl">Saved decisions and drafts</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">{storageDescription}</p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/decision")}>Start a new decision</Button>
      </div>

      {!session?.user && (
        <Card className="mt-8 border-primary/15 bg-primary/[.04] p-5">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Need to sync later?</p>
          <h2 className="mt-2 text-xl font-bold">Sign in when you’re ready to keep these decisions with your account.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Anonymous users can keep working locally now. Sign in to back it up when you are ready.
          </p>
          <GoogleSignInButton className="mt-4">
            Sign in with Google
          </GoogleSignInButton>
        </Card>
      )}

      <LegalAcceptanceGate mode="account">
        {(profileLastOpenedWorkflow || lastOpenedWorkflow) && (
          <Card className="mt-8 border-primary/20 bg-primary/[.04] p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Clock3 className="text-primary" size={16} />
              <p className="text-sm font-semibold">Last opened workflow</p>
            </div>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{lastWorkflow?.title ?? profileLastOpenedWorkflow ?? lastOpenedWorkflow}</p>
                <p className="mt-1 text-sm text-muted">Continue from your most recent workspace</p>
              </div>
              <Button variant="ghost" onClick={() => router.push(`/decision/${lastWorkflow?.pluginId ?? "decision"}/${lastWorkflow?.slug ?? profileLastOpenedWorkflow ?? lastOpenedWorkflow}`)}>Continue</Button>
            </div>
          </Card>
        )}

        {drafts.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center gap-2">
              <History className="text-primary" size={18} />
              <h2 className="text-2xl font-bold">Resume drafts</h2>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {drafts.map((draft) => {
                const workflow = decisionPluginRegistry.getWorkflow(draft.workflowId);
                return (
                  <Card key={`${draft.workflowId}:${draft.updatedAt}`} className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Draft</p>
                    <h3 className="mt-2 font-semibold">{workflow?.title ?? draft.workflowId}</h3>
                    <p className="mt-2 text-sm text-muted">Updated {new Date(draft.updatedAt).toLocaleString("en-IN")}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button onClick={() => router.push(`/decision/${draft.pluginId}/${workflow?.slug ?? draft.workflowId}`)}>Resume</Button>
                      <Button variant="secondary" onClick={() => { void orchestrator.clearDraft(draft.workflowId).then(refresh); }}>Delete draft</Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-10">
          <div className="flex items-center gap-2">
            <ArrowRight className="text-primary" size={18} />
            <h2 className="text-2xl font-bold">Saved results</h2>
          </div>
          {!saved.length ? (
            <Card className="mt-5 p-8 text-center">
              <p className="text-lg font-semibold">No saved decisions yet</p>
              <p className="mt-2 text-sm text-muted">Open any result and choose Save locally to pin it here.</p>
            </Card>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {saved.map((item) => {
                const workflow = decisionPluginRegistry.getWorkflow(item.workflowId);
                return (
                  <Card key={item.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Saved locally</p>
                        <h3 className="mt-2 text-lg font-semibold">{workflow?.title ?? item.workflowId}</h3>
                        <p className="mt-2 text-sm text-muted">Updated {new Date(item.updatedAt).toLocaleString("en-IN")}</p>
                      </div>
                      <Button variant="ghost" onClick={() => { void orchestrator.deleteDecision(item.id).then(refresh); }}><Trash2 size={16} /></Button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button onClick={() => router.push(`/decision/result/${item.id}`)}>Open result</Button>
                      <Button variant="secondary" onClick={() => router.push(`/decision/${item.pluginId}/${workflow?.slug ?? item.workflowId}`)}>Revisit</Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </LegalAcceptanceGate>
    </main>
  );
}
