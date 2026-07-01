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
          <button key={plugin.id} type="button" onClick={() => setSelected(plugin.id)} className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-bold transition ${selected === plugin.id ? "border-primary bg-primary text-white shadow-glow" : "border-border bg-white text-muted hover:border-primary/30 hover:text-primary"}`}>{plugin.name}</button>
        ))}
      </div>
      <div className="mt-6 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {workflows.map((workflow) => <DecisionSuggestionCard key={workflow.id} workflow={workflow} />)}
      </div>
    </div>
  );
}
