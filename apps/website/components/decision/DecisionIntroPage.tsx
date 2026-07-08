"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Bookmark, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";
import { authClient } from "@datastorified/auth";
import { Badge, Button, Card } from "@datastorified/ui";
import { DecisionTimelineMini } from "./TrustIndicators";
import { getDecisionConfidence } from "./DecisionConfidence";
import { ProgressiveProfileNudge } from "../profile/ProgressiveProfileNudge";
export type DecisionIntroWorkflow = {
  pluginId: string;
  slug: string;
  title: string;
  description: string;
  category?: string;
  version: string;
  questionCount: number;
  factorCount: number;
  estimatedTime: string;
  difficulty: "easy" | "medium" | "hard";
  disclaimerType: "none" | "finance" | "insurance" | "legal" | "health";
};

export function DecisionIntroPage({ workflow }: { workflow: DecisionIntroWorkflow }) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const disclaimer = getDisclaimerCopy(workflow.disclaimerType);
  const startHref = `/decision/${workflow.pluginId}/${workflow.slug}/start`;
  const confidence = getDecisionConfidence({
    answerProgress: { answered: 0, total: workflow.questionCount, requiredAnswered: 0, requiredTotal: workflow.questionCount },
    profileAnalysis: session?.user ? { label: "Decision confidence", description: "Your saved profile can improve previews.", percentage: 0 } : undefined,
    decisionSignals: Math.min(3, Math.ceil(workflow.factorCount / 4)),
    assumptions: workflow.disclaimerType === "finance" ? ["Rates and inflation may change"] : [],
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => router.back()} className="min-h-11 px-0 text-sm font-semibold text-muted">
            <ArrowRight className="rotate-180" size={16} />
            Back
          </Button>
          <Button variant="ghost" className="min-h-11 px-3 text-sm font-semibold text-muted" onClick={() => router.push("/decision/saved")}>
            <Bookmark size={16} />
            Bookmark
          </Button>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-border bg-white shadow-soft">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6 p-5 sm:p-8">
              <Badge>{workflow.category ?? "Decision"}</Badge>
              <div className="space-y-3">
                <h1 className="text-balance text-3xl font-bold tracking-[-.04em] sm:text-5xl">{workflow.title}</h1>
                <p className="max-w-3xl text-base leading-7 text-muted sm:text-lg">{workflow.description}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetaStat label="Time" value={workflow.estimatedTime} />
                <MetaStat label="Questions" value={`${workflow.questionCount}`} />
                <MetaStat label="Factors" value={`${workflow.factorCount}`} />
                <MetaStat label="Difficulty" value={prettyDifficulty(workflow.difficulty)} />
                <MetaStat label="Last updated" value={`v${workflow.version}`} />
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href={startHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-accent px-5 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5">
                  Start Decision <ArrowRight size={16} />
                </Link>
                <Button variant="secondary" className="min-h-12 px-5 text-sm font-semibold" onClick={() => router.push("/decision/saved")}>
                  Save for Later
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoList title="You will receive" items={["Suitability Score", "Trade-off Analysis", "Risk Summary", "Scenario Simulation", "Action Checklist"]} />
                <InfoList title="Decision information" items={[`Category: ${workflow.category ?? "Decision"}`, `Estimated time: ${workflow.estimatedTime}`, `Question count: ${workflow.questionCount}`, `Factor count: ${workflow.factorCount}`, `Difficulty: ${prettyDifficulty(workflow.difficulty)}`, `Last updated: v${workflow.version}`, `Disclaimer: ${workflow.disclaimerType}`]} />
              </div>
            </div>

            <div className="border-t border-border bg-soft/30 p-5 sm:p-8 lg:border-l lg:border-t-0">
              <div className="grid h-full place-items-center rounded-[1.75rem] border border-dashed border-primary/20 bg-gradient-to-br from-primary/[.06] to-accent/[.08] p-6 text-center">
                <div className="space-y-4">
                  <div className="mx-auto grid size-20 place-items-center rounded-[1.75rem] bg-white text-primary shadow-sm">
                    <Sparkles size={32} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Decision preview</p>
                    <p className="mt-2 text-sm leading-6 text-muted">{workflow.description}</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Badge className="border-border bg-white text-muted">Premium intro</Badge>
                    <Badge className="border-border bg-white text-muted">Mobile-first</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {disclaimer && (
          <Card className="border-amber-500/15 bg-amber-500/[.04] p-5">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 shrink-0 text-amber-700" size={18} />
              <div className="space-y-1">
                <p className="text-sm font-bold text-amber-900">Educational disclaimer</p>
                <p className="text-sm leading-6 text-amber-900/85">{disclaimer}</p>
              </div>
            </div>
          </Card>
        )}

        <ProgressiveProfileNudge
          context={workflow.category?.toLowerCase()}
          profile={session?.user ? { source: "cloud" } : undefined}
          title={workflow.disclaimerType === "finance" ? "Add your risk comfort to improve money decision confidence." : workflow.disclaimerType === "health" ? "Add one detail to improve health decision confidence." : "Add one detail to improve future decision confidence."}
          description={session?.user ? "This stays optional. We only use it to sharpen the preview confidence, not to force onboarding." : "You can keep going anonymously and skip this anytime."}
          onSkip={() => router.push(startHref)}
          onSaved={() => router.push("/profile")}
        />

        <Card className="border-primary/15 bg-primary/[.04] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Improve accuracy</p>
              <h2 className="mt-2 text-xl font-bold">Add one detail to make this decision sharper.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">This is optional. You can skip it and continue straight into the decision flow.</p>
            </div>
            <Button variant="secondary" onClick={() => router.push("/profile")}>Add one detail</Button>
          </div>
          {!session?.user && (
            <p className="mt-3 text-sm leading-6 text-muted">You can keep using the app anonymously. Google sign-in is optional here.</p>
          )}
        </Card>

        <DecisionTimelineMini
          events={[
            { label: "Started" },
            { label: "Draft saved" },
          ]}
        />

        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Decision confidence</p>
          <p className="mt-2 text-3xl font-bold">{confidence.score}%</p>
          <p className="mt-2 text-sm leading-6 text-muted">Preview confidence grows as answers and optional profile details improve.</p>
        </Card>
      </div>
    </main>
  );
}

function MetaStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-soft/30 p-4">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-muted">{label}</p>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 shrink-0 text-primary" size={16} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function prettyDifficulty(value: "easy" | "medium" | "hard" | undefined): string {
  if (!value) return "Medium";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getDisclaimerCopy(type?: string): string | null {
  const normalized = (type ?? "").toLowerCase();
  if (normalized === "finance") {
    return "This workflow is for educational purposes only. It helps you compare trade-offs, but it does not give direct investment advice.";
  }
  if (normalized === "insurance") {
    return "This workflow is for educational purposes only. It helps you understand coverage trade-offs, but it is not a replacement for licensed advice.";
  }
  if (normalized === "legal") {
    return "This workflow is for educational purposes only. It can help structure your thinking, but it is not legal advice.";
  }
  if (normalized === "health") {
    return "This workflow is for educational purposes only. It can help organize your thinking, but it is not medical advice.";
  }
  return null;
}
