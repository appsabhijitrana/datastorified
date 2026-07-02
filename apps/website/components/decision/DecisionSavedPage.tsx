"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock3, History, Trash2 } from "lucide-react";
import { Badge, Button, Card } from "@datastorified/ui";
import { decisionPluginRegistry, localDecisionStorage, type DecisionMemoryDraft, type StoredDecision } from "@datastorified/decision-os";

export function DecisionSavedPage() {
  const router = useRouter();
  const [saved, setSaved] = useState<StoredDecision[]>([]);
  const [drafts, setDrafts] = useState<DecisionMemoryDraft[]>([]);
  const [profile, setProfile] = useState(localDecisionStorage.getProfile());

  const refresh = () => {
    setSaved(localDecisionStorage.listSaved());
    setDrafts(localDecisionStorage.listDrafts());
    setProfile(localDecisionStorage.getProfile());
  };

  useEffect(() => {
    refresh();
  }, []);

  const lastWorkflow = useMemo(() => {
    if (!profile.lastOpenedWorkflow) return undefined;
    return decisionPluginRegistry.getWorkflow(profile.lastOpenedWorkflow.workflowId);
  }, [profile]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge>Local memory</Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-[-.035em] sm:text-4xl">Saved decisions and drafts</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">Everything here stays on this device. Resume drafts, revisit saved results, and continue where you left off.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/decision")}>Start a new decision</Button>
      </div>

      {profile.lastOpenedWorkflow && (
        <Card className="mt-8 border-primary/20 bg-primary/[.04] p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Clock3 className="text-primary" size={16} />
            <p className="text-sm font-semibold">Last opened workflow</p>
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">{lastWorkflow?.title ?? profile.lastOpenedWorkflow.workflowId}</p>
              <p className="mt-1 text-sm text-muted">Opened {new Date(profile.lastOpenedWorkflow.openedAt).toLocaleString("en-IN")}</p>
            </div>
            <Button variant="ghost" onClick={() => router.push(`/decision/${profile.lastOpenedWorkflow?.pluginId}/${profile.lastOpenedWorkflow?.slug}`)}>Continue</Button>
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
                    <Button variant="secondary" onClick={() => { localDecisionStorage.clearDraft(draft.workflowId); refresh(); }}>Delete draft</Button>
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
                    <Button variant="ghost" onClick={() => { localDecisionStorage.deleteSaved(item.id); refresh(); }}><Trash2 size={16} /></Button>
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
    </main>
  );
}
