"use client";

import { useMemo, useState } from "react";
import { staticDecisionPlugins } from "@datastorified/decision-os";
import { DecisionSuggestionCard } from "./DecisionSuggestionCard";

export function DecisionCategoryGrid() {
  const [selected, setSelected] = useState("all");
  const workflows = useMemo(() => staticDecisionPlugins.flatMap((plugin) => selected === "all" || plugin.id === selected ? plugin.workflows : []), [selected]);
  const plugins = staticDecisionPlugins.filter((plugin) => plugin.workflows.length > 0);
  return (
    <div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" aria-label="Decision categories">
        {[{ id: "all", name: "All decisions" }, ...plugins].map((plugin) => (
          <button
            key={plugin.id}
            type="button"
            aria-pressed={selected === plugin.id}
            onClick={() => setSelected(plugin.id)}
            className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${selected === plugin.id ? "border-primary bg-primary text-white shadow-glow" : "border-border bg-white text-muted hover:border-primary/30 hover:text-primary"}`}
          >
            {plugin.name}
          </button>
        ))}
      </div>
      <div className="mt-6 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {workflows.length ? (
          workflows.map((workflow) => <DecisionSuggestionCard key={workflow.id} workflow={workflow} />)
        ) : (
          <p className="col-span-full rounded-2xl border border-border bg-white p-6 text-sm text-muted">No decision flows in this category yet.</p>
        )}
      </div>
    </div>
  );
}
