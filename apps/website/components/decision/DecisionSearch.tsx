"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock3, Search, X } from "lucide-react";
import { Badge, Button, Card, Chip, EmptyState, SearchInput } from "@datastorified/ui/design-system";
import { getDecisionRoute, getPopularDecisions, getTrendingDecisions, searchDecisions, type DiscoveryDecision } from "@datastorified/decision-os";
import { storage } from "@datastorified/storage";
import { decisionRouteFromText } from "../../lib/decision-routing";

const trendingQueries = ["FD vs SIP", "Should I buy a house?", "EV vs Petrol", "Change job", "Phone comparison", "Emergency fund", "Term insurance"];

export function DecisionSearch({ large = false, initialValue = "", placeholder = "Search any decision…", ariaLabel = "Search any decision…" }: { large?: boolean; initialValue?: string; placeholder?: string; ariaLabel?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentDecisionSuggestions, setRecentDecisionSuggestions] = useState<string[]>([]);

  useEffect(() => {
    setIsClient(true);
    setRecentSearches(storage.getSearches());
    setRecentDecisionSuggestions(storage.getDecisionSuggestions());
  }, []);

  const normalizedQuery = query.trim();
  const results = useMemo(() => (normalizedQuery ? searchDecisions(normalizedQuery).slice(0, 6) : []), [normalizedQuery]);
  const suggestedDecisions = useMemo(() => {
    if (normalizedQuery) return results.slice(0, 3);
    return [...getTrendingDecisions().slice(0, 3), ...getPopularDecisions().slice(0, 3)].filter((decision, index, items) => items.findIndex((item) => item.id === decision.id) === index).slice(0, 6);
  }, [normalizedQuery, results]);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const runSearch = (value: string) => {
    const next = value.trim();
    if (!next) return;
    storage.addSearch(next);
    setRecentSearches(storage.getSearches());
    const route = decisionRouteFromText(next) ?? getDecisionRoute(searchDecisions(next)[0]?.slug ?? "");
    if (route) {
      router.push(route);
      close();
      return;
    }
    setIsOpen(true);
  };

  const handleSuggest = () => {
    if (!normalizedQuery) return;
    storage.addDecisionSuggestion(normalizedQuery);
    setRecentDecisionSuggestions(storage.getDecisionSuggestions());
  };

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={open}
        aria-label={ariaLabel}
        className={`flex w-full items-center gap-3 border border-border bg-white text-left shadow-lift transition hover:-translate-y-0.5 hover:border-primary/20 ${large ? "min-h-16 rounded-[28px] px-4 py-3 sm:px-5" : "min-h-14 rounded-2xl px-3.5 py-2.5"}`}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Search size={20} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink/90">{normalizedQuery || placeholder}</span>
          <span className="block text-xs text-muted">{large ? "Tap to search or use keyboard" : "Search decisions, recent items, and suggestions"}</span>
        </span>
        <span className="hidden shrink-0 items-center gap-1 rounded-full bg-soft px-3 py-1 text-xs font-semibold text-muted sm:inline-flex">Search</span>
      </button>

      {isClient && isOpen && createPortal(
        <div className="fixed inset-0 z-[70] bg-ink/35 backdrop-blur-sm">
          <div className={`absolute inset-x-0 bottom-0 mx-auto w-full max-w-4xl ${large ? "sm:inset-auto sm:top-16 sm:bottom-16 sm:rounded-[32px]" : "rounded-t-[32px] sm:inset-auto sm:top-16 sm:bottom-auto sm:rounded-[32px]"} bg-surface shadow-2xl`}>
            <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Decision search</p>
                <h2 className="mt-1 text-lg font-bold sm:text-2xl">Search any decision</h2>
              </div>
              <button type="button" onClick={close} className="grid size-10 place-items-center rounded-full border border-border text-muted hover:border-primary/20 hover:text-primary" aria-label="Close search">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
              <div className="space-y-5">
                <SearchInput
                  aria-label={ariaLabel}
                  placeholder={placeholder}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") close();
                    if (event.key === "Enter") runSearch(query);
                  }}
                  autoFocus
                />

                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => runSearch(query)} className="min-h-11" disabled={!normalizedQuery}>Find decision</Button>
                  <Button variant="secondary" onClick={handleSuggest} disabled={!normalizedQuery}>Suggest this decision</Button>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-muted">Recent searches</p>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.length ? recentSearches.map((item) => <Chip key={item} onClick={() => setQuery(item)}>{item}</Chip>) : <span className="text-sm text-muted">No recent searches yet.</span>}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-muted">Trending searches</p>
                  <div className="flex flex-wrap gap-2">
                    {trendingQueries.map((item) => <Chip key={item} onClick={() => setQuery(item)}>{item}</Chip>)}
                  </div>
                </div>

                {recentDecisionSuggestions.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-muted">Suggested decisions you saved</p>
                    <div className="flex flex-wrap gap-2">
                      {recentDecisionSuggestions.map((item) => <Chip key={item} onClick={() => setQuery(item)}>{item}</Chip>)}
                    </div>
                  </div>
                )}

                {normalizedQuery ? (
                  <SearchResults query={query} results={results} onSuggest={handleSuggest} />
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-muted">Suggested decisions</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {suggestedDecisions.map((decision) => <DecisionSearchCard key={decision.id} decision={decision} />)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

function SearchResults({ query, results, onSuggest }: { query: string; results: DiscoveryDecision[]; onSuggest: () => void }) {
  if (results.length === 0) {
    return (
      <Card className="border-dashed border-primary/20 bg-soft/40 p-5">
        <EmptyState
          title="We do not have this decision yet."
          description="Try a different phrase or suggest this decision so we can keep it locally."
          action={<Button variant="secondary" onClick={onSuggest}>Suggest this decision</Button>}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-muted">Results for “{query}”</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {results.map((decision) => <DecisionSearchCard key={decision.id} decision={decision} />)}
      </div>
    </div>
  );
}

function DecisionSearchCard({ decision }: { decision: DiscoveryDecision }) {
  const href = getDecisionRoute(decision.slug);
  if (!href) {
    return (
      <Card className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <Badge>{decision.category}</Badge>
          <span className="text-xs font-bold text-muted">Coming soon</span>
        </div>
        <h3 className="text-lg font-bold">{decision.title}</h3>
        <p className="text-sm leading-6 text-muted">{decision.description}</p>
        <Button variant="secondary" disabled>Coming soon</Button>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <Badge>{decision.category}</Badge>
        <Badge className="border-border bg-soft text-muted">{decision.tags[0] ?? "Decision"}</Badge>
      </div>
      <h3 className="text-lg font-bold">{decision.title}</h3>
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
        <span className="inline-flex items-center gap-1"><Clock3 size={14} /> {decision.estimatedTime}</span>
        <span>{decision.factorCount} factors</span>
      </div>
      <p className="text-sm leading-6 text-muted">{decision.description}</p>
      <div className="mt-auto flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[.14em] text-primary">{decision.shortTitle}</span>
        <a href={href} className="inline-flex">
          <Button variant="secondary">Start <ArrowRight size={16} /></Button>
        </a>
      </div>
    </Card>
  );
}
