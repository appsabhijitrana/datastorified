"use client";

import {useEffect, useMemo, useState} from "react";
import {Calculator, Sparkles, UserRound} from "lucide-react";
import {calculators, searchCalculators} from "@datastorified/calculators-engine/registry";
import {storage} from "@datastorified/storage";
import {trackFavorite, trackSearch} from "@datastorified/analytics";
import {Badge, BottomNav, Button, CalculatorCard, Card, CategorySection, EmptyState, Footer, Header, SearchBox} from "@datastorified/ui";

function Grid({items, favs, toggle}: {items: typeof calculators; favs: string[]; toggle: (s: string) => void}) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map((x) => <CalculatorCard key={x.slug} name={x.name} description={x.description} category={x.category} href={`/${x.slug}`} favorite={favs.includes(x.slug)} onFavorite={() => toggle(x.slug)} icon={<Calculator size={20} />} />)}</div>;
}

export default function Home() {
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [favs, setFavs] = useState<string[]>([]);
  const [searches, setSearches] = useState<string[]>([]);

  useEffect(() => {
    setRecent(storage.getRecent("calculators"));
    setFavs(storage.getFavorites("calculators"));
    setSearches(storage.getSearches());
  }, []);

  const found = useMemo(() => searchCalculators(q), [q]);

  const submitSearch = () => {
    const query = q.trim();
    if (query.length < 2) return;
    storage.addSearch(query);
    trackSearch(query, "calculators");
    setSearches(storage.getSearches());
  };

  const toggle = (slug: string) => {
    const active = storage.toggleFavorite("calculators", slug);
    trackFavorite(slug, "calculator", active);
    setFavs(storage.getFavorites("calculators"));
  };

  const sections = [...new Set(calculators.map((x) => x.category))];

  return (
    <>
      <Header surface="calculators" />
      <main>
        <section className="hero-grid border-b border-border">
          <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 sm:py-20">
            <Badge><Sparkles size={13} className="mr-1" /> Clear numbers. Better decisions.</Badge>
            <h1 className="mt-5 text-balance text-4xl font-bold tracking-[-.04em] sm:text-6xl">Smart calculators that <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">explain the result</span></h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-muted">Explore freely. Your drafts and favorites stay private in this browser.</p>
            <div id="search" className="mx-auto mt-8 max-w-2xl">
              <SearchBox large value={q} onChange={setQ} onSubmit={submitSearch} placeholder="Search EMI, SIP, tax, health…" />
              {!q && searches.length > 0 && <div className="mt-3 flex flex-wrap justify-center gap-2">{searches.slice(0, 5).map((x) => <button key={x} onClick={() => setQ(x)} className="rounded-full border border-border bg-white/80 px-3 py-1.5 text-sm text-muted transition hover:border-primary/30 hover:text-primary">{x}</button>)}</div>}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5">
              <h2 className="text-lg font-bold">Search by outcome</h2>
              <p className="mt-2 text-sm leading-6 text-muted">Try phrases like <span className="font-medium text-ink">EMI calculator for home loan</span>, <span className="font-medium text-ink">SIP calculator for monthly investing</span>, or <span className="font-medium text-ink">retirement planning calculator</span>.</p>
            </Card>
            <Card className="p-5">
              <h2 className="text-lg font-bold">Compare related calculators</h2>
              <p className="mt-2 text-sm leading-6 text-muted">Each page links to nearby intent, such as <span className="font-medium text-ink">loan prepayment savings</span>, <span className="font-medium text-ink">loan eligibility</span>, and <span className="font-medium text-ink">home affordability</span>.</p>
            </Card>
            <Card className="p-5">
              <h2 className="text-lg font-bold">Keep exploring by category</h2>
              <p className="mt-2 text-sm leading-6 text-muted">Finance, investing, tax, property, health, and general planning pages are all indexed individually and grouped by topic.</p>
            </Card>
          </div>
        </section>

        <div className="mx-auto max-w-7xl space-y-16 px-4 py-14 sm:px-6">
          {q ? <CategorySection title={`${found.length} result${found.length === 1 ? "" : "s"} for “${q}”`}>{found.length ? <Grid items={found} favs={favs} toggle={toggle} /> : <EmptyState title="No calculator found" />}</CategorySection> : (
            <>
              <CategorySection title="Popular calculators" description="The questions people are working through right now"><Grid items={calculators.filter((x) => x.popular)} favs={favs} toggle={toggle} /></CategorySection>
              {recent.length > 0 && <CategorySection id="recent" title="Recently used" description="Pick up where you left off"><Grid items={recent.map((s) => calculators.find((x) => x.slug === s)).filter(Boolean) as typeof calculators} favs={favs} toggle={toggle} /></CategorySection>}
              {favs.length > 0 && <CategorySection title="Your favorites"><Grid items={favs.map((s) => calculators.find((x) => x.slug === s)).filter(Boolean) as typeof calculators} favs={favs} toggle={toggle} /></CategorySection>}
              <div id="categories" className="space-y-16">{sections.map((cat) => <CategorySection key={cat} title={cat}><Grid items={calculators.filter((x) => x.category === cat)} favs={favs} toggle={toggle} /></CategorySection>)}</div>
            </>
          )}

          <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-[.95fr_1.05fr]">
              <div>
                <Badge>FAQ</Badge>
                <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Answers for high-intent calculator searches</h2>
                <p className="mt-3 max-w-xl text-lg leading-8 text-muted">These questions are written to match how people search when they already know the problem they want to solve.</p>
              </div>
              <div className="space-y-3">
                <details className="group rounded-2xl border border-border bg-white p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">Which calculator should I use for a home loan?<span className="text-primary transition group-open:rotate-45">+</span></summary>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Start with EMI Calculator or Home Affordability, then compare them with Loan Eligibility and Loan Prepayment if you want to see how the numbers change over time.</p>
                </details>
                <details className="group rounded-2xl border border-border bg-white p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">Are there calculators for SIP, retirement, and tax planning?<span className="text-primary transition group-open:rotate-45">+</span></summary>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Yes. The catalog covers long-tail queries such as SIP calculator for monthly investing, retirement planning calculator, and several Indian tax and savings scenarios.</p>
                </details>
                <details className="group rounded-2xl border border-border bg-white p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">Do calculator pages have unique content for search engines?<span className="text-primary transition group-open:rotate-45">+</span></summary>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Yes. Each page has its own title, description, FAQ content, schema, and related calculators so the catalog can rank for both broad and specific intent.</p>
                </details>
                <details className="group rounded-2xl border border-border bg-white p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">Can I search by category instead of a calculator name?<span className="text-primary transition group-open:rotate-45">+</span></summary>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Absolutely. Category pages are indexed and include clustered calculators for finance, investing, tax, property, vehicles, business, health, and general conversion or planning tasks.</p>
                </details>
              </div>
            </div>
          </section>

          <section id="profile" className="scroll-mt-24">
            <Card className="flex flex-col items-start justify-between gap-5 bg-gradient-to-br from-primary/[.05] to-accent/[.07] p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-primary shadow-soft"><UserRound size={20} /></span>
                <div>
                  <h2 className="text-lg font-bold">Your work stays on this device</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">Favorites, recent calculators, and input drafts work without an account. Cloud sync is a future Pro feature.</p>
                </div>
              </div>
              <Button variant="secondary" disabled>Sign in to sync · Coming later</Button>
            </Card>
          </section>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
