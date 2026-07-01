import { ArrowUpRight, Calculator, Wrench } from "lucide-react";
import { Card } from "@datastorified/ui";
import type { DecisionWorkflow } from "@datastorified/decision-os";

const title = (slug: string) => slug.replace(/-calculator$/u, "").split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
export function DecisionRelatedTools({ workflow }: { workflow: DecisionWorkflow }) {
  return <div className="grid min-w-0 gap-4 sm:grid-cols-2"><Card className="min-w-0 p-5"><div className="flex items-center gap-2"><Calculator className="text-primary" /><h2 className="font-bold">Related calculators</h2></div><div className="mt-4 space-y-2">{workflow.relatedCalculators?.map((slug) => <a key={slug} href={`https://calculators.datastorified.com/${slug}`} className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-soft px-3 py-3 text-sm font-semibold hover:text-primary"><span className="truncate">{title(slug)}</span><ArrowUpRight className="shrink-0" size={15} /></a>)}</div></Card><Card className="min-w-0 p-5"><div className="flex items-center gap-2"><Wrench className="text-accent" /><h2 className="font-bold">Useful tools</h2></div><div className="mt-4 space-y-2">{workflow.relatedTools?.map((slug) => <a key={slug} href={`https://tools.datastorified.com/${slug}`} className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-soft px-3 py-3 text-sm font-semibold hover:text-primary"><span className="truncate">{title(slug)}</span><ArrowUpRight className="shrink-0" size={15} /></a>)}</div></Card></div>;
}
