import Link from "next/link";
import { Badge, Button } from "@datastorified/ui";
import { BrainCircuit, LockKeyhole, Sparkles } from "lucide-react";
import { DecisionSearch } from "./DecisionSearch";

export function DecisionHero() {
  return (
    <section className="hero-grid relative overflow-hidden border-b border-border">
      <div className="absolute left-1/2 top-8 -z-10 size-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/15 to-accent/15 blur-3xl sm:size-[720px]" />
      <div className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6 sm:py-24">
        <Badge><Sparkles size={13} className="mr-1" /> Decision OS</Badge>
        <h1 className="mx-auto mt-6 max-w-4xl text-balance text-4xl font-bold tracking-[-.045em] sm:text-6xl">
          What decision are you trying to <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">make today?</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
          Describe the choice in your own words. Decision OS finds the right guided workflow, scores the evidence, and gives you risks and next steps.
        </p>
        <div className="mx-auto mt-8 max-w-4xl text-left sm:mt-10"><DecisionSearch large /></div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/decision/saved"><Button variant="secondary">View saved decisions</Button></Link>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-semibold text-muted sm:text-sm">
          <span className="inline-flex items-center gap-1.5"><BrainCircuit size={15} className="text-primary" /> Transparent scoring</span>
          <span className="inline-flex items-center gap-1.5"><LockKeyhole size={15} className="text-primary" /> Saved only on this device</span>
        </div>
      </div>
    </section>
  );
}
