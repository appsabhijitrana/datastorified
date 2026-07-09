"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock3, Search, X } from "lucide-react";
import { authClient } from "@datastorified/auth";
import { trackDiscoveryEvent } from "@datastorified/analytics";
import { Badge, Button, Card, Chip, EmptyState, SearchInput } from "@datastorified/ui/design-system";
import { getDecisionRoute, getPopularDecisions, getTrendingDecisions, searchDecisions, type DiscoveryDecision } from "@datastorified/decision-os";
import { storage } from "@datastorified/storage";
import { decisionRouteFromText } from "../../lib/decision-routing";

const trendingQueries = ["FD vs SIP", "Should I buy a house?", "EV vs Petrol", "Change job", "Phone comparison", "Emergency fund", "Term insurance"];

export function DecisionSearch({ large = false, initialValue = "", placeholder = "Search any decision…", ariaLabel = "Search any decision…", sourceSection = "search" }: { large?: boolean; initialValue?: string; placeholder?: string; ariaLabel?: string; sourceSection?: string }) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [query, setQuery] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentDecisionSuggestions, setRecentDecisionSuggestions] = useState<string[]>([]);
  const deviceType = typeof window === "undefined" ? "unknown" : window.innerWidth < 768 ? "mobile" : "desktop";

  useEffect(() => {
    setRecentSearches(storage.getSearches());
    setRecentDecisionSuggestions(storage.getDecisionSuggestions());
  }, []);

  const normalizedQuery = query.trim();
  const results = useMemo(() => (normalizedQuery ? searchDecisions(normalizedQuery).slice(0, 6) : []), [normalizedQuery]);
  const suggestedDecisions = useMemo(() => {
    if (normalizedQuery) return results.slice(0, 3);
    return [...getTrendingDecisions().slice(0, 3), ...getPopularDecisions().slice(0, 3)].filter((decision, index, items) => items.findIndex((item) => item.id === decision.id) === index).slice(0, 6);
  }, [normalizedQuery, results]);

  const open = () => {
    setIsOpen(true);
    trackDiscoveryEvent("decision_search_opened", { source_section: sourceSection, is_logged_in: Boolean(session?.user), device_type: deviceType });
  };
  const close = () => setIsOpen(false);

  const runSearch = (value: string) => {
    const next = value.trim();
    if (!next) return;
    storage.addSearch(next);
    setRecentSearches(storage.getSearches());
    const searchResults = searchDecisions(next);
    const route = decisionRouteFromText(next) ?? getDecisionRoute(searchResults[0]?.slug ?? "");
    trackDiscoveryEvent("decision_search_submitted", { source_section: sourceSection, search_result_count: searchResults.length, is_logged_in: Boolean(session?.user), device_type: deviceType });
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
    trackDiscoveryEvent("decision_suggested", { source_section: sourceSection, is_logged_in: Boolean(session?.user), device_type: deviceType });
  };

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={open}
        aria-label="What decision are you trying to make today?"
        className={`flex w-full items-center gap-3 border border-border bg-white text-left shadow-lift transition hover:-translate-y-0.5 hover:border-primary/20 ${large ? "min-h-16 rounded-[28px] px-4 py-3 sm:px-5" : "min-h-14 rounded-2xl px-3.5 py-2.5"}`}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Search size={20} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink/90">{normalizedQuery || placeholder}</span>
          <span className="block text-xs text-muted">{large ? "Tap to search or use keyboard" : "Search decisions, recent items, and suggestions"}</span>
        </span>
        <span className="hidden shrink-0 items-center gap-1 rounded-full bg-soft px-3 py-1 text-xs font-semibold text-muted sm:inline-flex">Search</span>
      </button>

      {isOpen && (
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
                  <Button onClick={() => runSearch(query)} className="min-h-11" disabled={!normalizedQuery}>Find my decision</Button>
                  <Button variant="secondary" onClick={handleSuggest} disabled={!normalizedQuery}>Suggest this decision</Button>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-muted">Recent searches</p>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.length ? recentSearches.map((item) => <Chip key={item} onClick={() => { setQuery(item); runSearch(item); }}>{item}</Chip>) : <span className="text-sm text-muted">No recent searches yet.</span>}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-muted">Trending searches</p>
                  <div className="flex flex-wrap gap-2">
                    {trendingQueries.map((item) => <Chip key={item} onClick={() => { setQuery(item); runSearch(item); }}>{item}</Chip>)}
                  </div>
                </div>

                {recentDecisionSuggestions.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-muted">Suggested decisions you saved</p>
                    <div className="flex flex-wrap gap-2">
                      {recentDecisionSuggestions.map((item) => <Chip key={item} onClick={() => { setQuery(item); runSearch(item); }}>{item}</Chip>)}
                    </div>
                  </div>
                )}

                {normalizedQuery ? (
                  <SearchResults
                    query={query}
                    results={results}
                    onSuggest={handleSuggest}
                    sourceSection={sourceSection}
                    isLoggedIn={Boolean(session?.user)}
                    deviceType={deviceType}
                  />
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-muted">Suggested decisions</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {suggestedDecisions.map((decision) => <DecisionSearchCard key={decision.id} decision={decision} sourceSection={sourceSection} isLoggedIn={Boolean(session?.user)} deviceType={deviceType} />)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchResults({
  query,
  results,
  onSuggest,
  sourceSection,
  isLoggedIn,
  deviceType,
}: {
  query: string;
  results: DiscoveryDecision[];
  onSuggest: () => void;
  sourceSection: string;
  isLoggedIn: boolean;
  deviceType: string;
}) {
  if (results.length === 0) {
    return (
        <Card className="border-dashed border-primary/20 bg-soft/40 p-5">
          <EmptyState
          title="No matching decision flows"
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
        {results.map((decision) => <DecisionSearchCard key={decision.id} decision={decision} sourceSection={sourceSection} isLoggedIn={isLoggedIn} deviceType={deviceType} />)}
      </div>
    </div>
  );
}

function DecisionSearchCard({ decision, sourceSection, isLoggedIn, deviceType }: { decision: DiscoveryDecision; sourceSection: string; isLoggedIn: boolean; deviceType: string }) {
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
        <a href={href} className="inline-flex" onClick={() => trackDiscoveryEvent("decision_search_result_clicked", { decision_slug: decision.slug, category: decision.category, source_section: sourceSection, is_logged_in: isLoggedIn, device_type: deviceType })}>
          <Button variant="secondary">Start <ArrowRight size={16} /></Button>
        </a>
      </div>
    </Card>
  );
}
