import Link from "next/link";
import { Card } from "@datastorified/ui";
import type { DecisionConfig } from "@datastorified/decision-engine";
import type { DecisionSeo } from "../../lib/decision-seo";

export function DecisionSeoContent({
  config,
  seo,
  relatedDecisions,
}: {
  config: DecisionConfig;
  seo: DecisionSeo;
  relatedDecisions: DecisionConfig[];
}) {
  return (
    <section className="mt-14 border-t border-border pt-10" aria-labelledby="decision-guide-heading">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
        <div>
          <h2 id="decision-guide-heading" className="text-2xl font-bold sm:text-3xl">
            {seo.primaryKeyword.charAt(0).toUpperCase() + seo.primaryKeyword.slice(1)}: what this guide checks
          </h2>
          <p className="mt-4 leading-7 text-muted">{seo.summary}</p>
          <p className="mt-3 leading-7 text-muted">{seo.outcome}</p>
          <h3 className="mt-7 text-lg font-bold">What the analysis considers</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {config.factors.map((factor) => (
              <li key={factor.id} className="rounded-xl bg-soft px-4 py-3 text-sm">
                <span className="font-bold">{factor.label}:</span>{" "}
                <span className="text-muted">{factor.explanation}</span>
              </li>
            ))}
          </ul>
        </div>
        <Card className="h-fit p-5">
          <h2 className="text-lg font-bold">Explore related decisions</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Compare another choice using the same transparent scoring approach.</p>
          <div className="mt-4 space-y-2">
            {relatedDecisions.map((decision) => (
              <Link
                key={decision.id}
                href={`/decision/${decision.id}`}
                className="block rounded-xl bg-soft px-4 py-3 text-sm font-semibold transition hover:text-primary"
              >
                {decision.title}
              </Link>
            ))}
          </div>
          <Link href="/decision" className="mt-4 inline-block text-sm font-bold text-primary">
            View all decision-making tools
          </Link>
        </Card>
      </div>
      <p className="mt-8 text-xs leading-5 text-muted">
        This educational tool provides a structured comparison, not financial, investment, legal, or career advice. Verify important assumptions with qualified professionals where appropriate.
      </p>
    </section>
  );
}
