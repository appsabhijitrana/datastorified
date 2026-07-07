"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { Button, Card } from "@datastorified/ui";
import { detectIntent, decisionPluginRegistry } from "@datastorified/decision-os";
import { decisionRouteFromText } from "../../lib/decision-routing";
import { DecisionSuggestionCard } from "./DecisionSuggestionCard";

export function DecisionSearch({ large = false, initialValue = "", placeholder = "Should I buy a house?", ariaLabel = "What decision are you trying to make today?" }: { large?: boolean; initialValue?: string; placeholder?: string; ariaLabel?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const intent = useMemo(() => query.trim().length >= 2 ? detectIntent(query, decisionPluginRegistry.listWorkflows(), 3) : undefined, [query]);
  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const matches = decisionPluginRegistry.searchWorkflows(query, 3);
    return matches.length ? matches : (intent?.matches ?? []).map((match) => decisionPluginRegistry.getWorkflow(match.workflowId)).filter(Boolean);
  }, [intent, query]);

  const submit = () => {
    const route = decisionRouteFromText(query) ?? (suggestions[0] ? `/decision/${suggestions[0].pluginId}/${suggestions[0].slug}` : undefined);
    if (route) router.push(route);
    else setShowSuggestions(true);
  };

  return (
    <div className="min-w-0">
      <Card className={`flex min-w-0 items-center gap-2 border-primary/10 bg-white/95 p-2 shadow-lift backdrop-blur ${large ? "rounded-[28px] sm:p-3" : "rounded-2xl"}`}>
        <span className="ml-1 grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary sm:ml-2"><Search size={20} /></span>
        <input
          aria-label={ariaLabel}
          value={query}
          onChange={(event) => { setQuery(event.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(event) => event.key === "Enter" && submit()}
          placeholder={placeholder}
          className={`min-w-0 flex-1 bg-transparent px-1 font-medium outline-none placeholder:text-muted/60 ${large ? "min-h-14 text-base sm:text-lg" : "min-h-11"}`}
        />
        <Button onClick={submit} aria-label="Find my decision" className="shrink-0 rounded-2xl px-3 sm:px-5">
          <span className="hidden sm:inline">Find my decision</span><Sparkles className="sm:hidden" size={17} aria-hidden="true" /><ArrowRight size={16} aria-hidden="true" />
        </Button>
      </Card>
      {showSuggestions && query.trim().length >= 2 && suggestions.length === 0 && (
        <Card className="mt-5 p-5" role="status">
          <p className="font-semibold">No matching decision flows</p>
          <p className="mt-1 text-sm leading-6 text-muted">Try a phrase like &ldquo;buy a house&rdquo; or browse the categories below.</p>
        </Card>
      )}
      {showSuggestions && query.trim().length >= 2 && suggestions.length > 0 && (
        <div className="mt-5">
          <p className="mb-3 text-sm font-semibold text-muted">Best matching decision flows</p>
          <div className="grid min-w-0 gap-3 sm:grid-cols-3">
            {suggestions.map((workflow) => {
              if (!workflow) return null;
              const confidence = intent?.matches.find((match) => match.workflowId === workflow.id)?.confidence;
              return <DecisionSuggestionCard key={workflow.id} workflow={workflow} confidence={confidence} />;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
