import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { Badge, Card } from "@datastorified/ui";
import { getDecisionRoute, type DecisionWorkflow, type DiscoveryDecision } from "@datastorified/decision-os";
import type { DecisionWorkflowRef } from "@datastorified/sdk";

type DecisionSuggestionProps =
  | { decision: DiscoveryDecision; confidence?: number }
  | { workflow: DecisionWorkflow | DecisionWorkflowRef; confidence?: number };

export function DecisionSuggestionCard(props: DecisionSuggestionProps) {
  const decision = "decision" in props ? props.decision : workflowToDecision(props.workflow);
  const href = "workflow" in props ? `/decision/${props.workflow.pluginId}/${props.workflow.slug}` : getDecisionRoute(decision.slug);
  if (!href) {
    return (
      <Card className="flex h-full min-w-0 flex-col overflow-hidden p-5">
        <div className="flex items-start justify-between gap-3">
          <Badge>{decision.category}</Badge>
          <span className="text-xs font-bold text-muted">Coming soon</span>
        </div>
        <h3 className="mt-4 text-lg font-bold tracking-tight">{decision.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{decision.description}</p>
        <p className="mt-auto pt-5 text-sm font-semibold text-muted">Suggest this decision from Explore.</p>
      </Card>
    );
  }
  return (
    <Link href={href} className="group block h-full min-w-0">
      <Card className="flex h-full min-w-0 flex-col overflow-hidden p-5 transition duration-300 group-hover:-translate-y-1 group-hover:border-primary/20 group-hover:shadow-lift">
        <div className="flex items-start justify-between gap-3">
          <Badge>{decision.category}</Badge>
          <span className="shrink-0 text-xs font-bold text-primary">{decision.factorCount} factors</span>
        </div>
        <h3 className="mt-4 text-lg font-bold tracking-tight">{decision.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{decision.description}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-sm font-bold text-primary">
          <span className="inline-flex items-center gap-1 text-muted"><Clock3 size={14} /> {decision.estimatedTime}</span>
          <span className="inline-flex items-center gap-1">Start <ArrowUpRight size={15} /></span>
        </div>
      </Card>
    </Link>
  );
}

function workflowToDecision(workflow: Pick<DecisionWorkflowRef, "id" | "slug" | "pluginId" | "title" | "description" | "category"> & Partial<DecisionWorkflow>): DiscoveryDecision {
  return {
    id: workflow.id,
    slug: workflow.slug,
    title: workflow.title,
    shortTitle: workflow.title.replace(/^should i /i, "").replace(/\?$/, ""),
    description: workflow.description,
    category: workflow.category ?? "Decision",
    subcategory: workflow.category,
    estimatedTime: "3 min",
    factorCount: workflow.weights?.length || workflow.questions?.length || 4,
    difficulty: "medium",
    popularityScore: 0,
    trendingScore: 0,
    tags: [...new Set([workflow.category ?? "Decision", ...(workflow.intent?.keywords ?? []), ...(workflow.aliases ?? []), ...(workflow.intent?.aliases ?? [])])],
    searchKeywords: [...new Set([workflow.title, workflow.slug.replace(/-/gu, " "), workflow.description, ...(workflow.intent?.keywords ?? []), ...(workflow.aliases ?? []), ...(workflow.intent?.aliases ?? []), ...(workflow.intent?.examples ?? [])])],
    aliases: [...new Set([...(workflow.aliases ?? []), ...(workflow.intent?.aliases ?? [])])],
    relatedDecisionSlugs: [],
    isQuickDecision: (workflow.questions?.length ?? 0) <= 6,
    isTrending: false,
    isPopular: false,
    status: "live",
    disclaimerType: "none",
  };
}
