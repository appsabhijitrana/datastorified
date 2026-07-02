import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { Badge, Card } from "@datastorified/ui";

type WorkflowCardData = {
  id: string;
  slug: string;
  pluginId: string;
  title: string;
  description: string;
  category?: string;
};

export function DecisionSuggestionCard({ workflow, confidence }: { workflow: WorkflowCardData; confidence?: number }) {
  return (
    <Link href={`/decision/${workflow.pluginId}/${workflow.slug}`} className="group block h-full min-w-0">
      <Card className="flex h-full min-w-0 flex-col overflow-hidden p-5 transition duration-300 group-hover:-translate-y-1 group-hover:border-primary/20 group-hover:shadow-lift">
        <div className="flex items-start justify-between gap-3">
          <Badge>{workflow.category ?? workflow.pluginId}</Badge>
          {confidence !== undefined && <span className="shrink-0 text-xs font-bold text-primary">{Math.round(confidence * 100)}% match</span>}
        </div>
        <h3 className="mt-4 text-lg font-bold tracking-tight">{workflow.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{workflow.description}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-sm font-bold text-primary">
          <span className="inline-flex items-center gap-1 text-muted"><Clock3 size={14} /> 3–5 min</span>
          <span className="inline-flex items-center gap-1">Start <ArrowUpRight size={15} /></span>
        </div>
      </Card>
    </Link>
  );
}
