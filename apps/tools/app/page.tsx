"use client";

import {useEffect, useMemo, useState} from "react";
import {Sparkles, UserRound, Wrench} from "lucide-react";
import {tools, searchTools} from "@datastorified/tools-engine/registry";
import {storage} from "@datastorified/storage";
import {trackFavorite, trackSearch} from "@datastorified/analytics";
import {Badge, BottomNav, Button, Card, CategorySection, EmptyState, Footer, Header, SearchBox, ToolCard} from "@datastorified/ui";

function Grid({items, favs, toggle}: {items: typeof tools; favs: string[]; toggle: (s: string) => void}) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map((x) => <ToolCard key={x.slug} name={x.name} description={x.description} category={x.category} href={`/${x.slug}`} favorite={favs.includes(x.slug)} onFavorite={() => toggle(x.slug)} icon={<Wrench size={20} />} />)}</div>;
}

export default function Home() {
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [favs, setFavs] = useState<string[]>([]);
  const [searches, setSearches] = useState<string[]>([]);

  useEffect(() => {
    setRecent(storage.getRecent("tools"));
    setFavs(storage.getFavorites("tools"));
    setSearches(storage.getSearches());
  }, []);

  const found = useMemo(() => searchTools(q), [q]);

  const submitSearch = () => {
    const query = q.trim();
    if (query.length < 2) return;
    storage.addSearch(query);
    trackSearch(query, "tools");
    setSearches(storage.getSearches());
  };

  const toggle = (slug: string) => {
    const active = storage.toggleFavorite("tools", slug);
    trackFavorite(slug, "tool", active);
    setFavs(storage.getFavorites("tools"));
  };

  const sections = [...new Set(tools.map((x) => x.category))];

  return (
    <>
      <Header surface="tools" />
      <main>
        <section className="hero-grid border-b border-border">
          <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 sm:py-20">
            <Badge><Sparkles size={13} className="mr-1" /> Useful, fast, and pleasantly quiet</Badge>
            <h1 className="mt-5 text-balance text-4xl font-bold tracking-[-.04em] sm:text-6xl">Everyday tools without the <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">internet clutter</span></h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-muted">Quick utilities for text, code, files, and small jobs. No account required.</p>
            <div id="search" className="mx-auto mt-8 max-w-2xl">
              <SearchBox large value={q} onChange={setQ} onSubmit={submitSearch} placeholder="Search JSON, PDF, password, text…" />
              {!q && searches.length > 0 && <div className="mt-3 flex flex-wrap justify-center gap-2">{searches.slice(0, 5).map((x) => <button key={x} onClick={() => setQ(x)} className="rounded-full border border-border bg-white/80 px-3 py-1.5 text-sm text-muted transition hover:border-primary/30 hover:text-primary">{x}</button>)}</div>}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5">
              <h2 className="text-lg font-bold">Search the exact task</h2>
              <p className="mt-2 text-sm leading-6 text-muted">Long-tail phrases like <span className="font-medium text-ink">PDF merge online</span>, <span className="font-medium text-ink">JSON formatter for developers</span>, and <span className="font-medium text-ink">password generator without signup</span> map directly to a tool page.</p>
            </Card>
            <Card className="p-5">
              <h2 className="text-lg font-bold">Find related utilities fast</h2>
              <p className="mt-2 text-sm leading-6 text-muted">Every tool page links to nearby helpers such as CSV/JSON conversion, text cleanup, image tools, and PDF workflows.</p>
            </Card>
            <Card className="p-5">
              <h2 className="text-lg font-bold">Stay private by default</h2>
              <p className="mt-2 text-sm leading-6 text-muted">The tools surface highlights browser-side processing, which helps match searches from users who want quick, local, no-upload utilities.</p>
            </Card>
          </div>
        </section>

        <div className="mx-auto max-w-7xl space-y-16 px-4 py-14 sm:px-6">
          {q ? <CategorySection title={`${found.length} result${found.length === 1 ? "" : "s"} for “${q}”`}>{found.length ? <Grid items={found} favs={favs} toggle={toggle} /> : <EmptyState title="No tool found" />}</CategorySection> : (
            <>
              <CategorySection title="Popular tools" description="Fast answers for common small jobs"><Grid items={tools.filter((x) => x.popular)} favs={favs} toggle={toggle} /></CategorySection>
              {recent.length > 0 && <CategorySection id="recent" title="Recently used"><Grid items={recent.map((s) => tools.find((x) => x.slug === s)).filter(Boolean) as typeof tools} favs={favs} toggle={toggle} /></CategorySection>}
              {favs.length > 0 && <CategorySection title="Your favorites"><Grid items={favs.map((s) => tools.find((x) => x.slug === s)).filter(Boolean) as typeof tools} favs={favs} toggle={toggle} /></CategorySection>}
              <div id="categories" className="space-y-16">{sections.map((cat) => <CategorySection key={cat} title={cat}><Grid items={tools.filter((x) => x.category === cat)} favs={favs} toggle={toggle} /></CategorySection>)}</div>
            </>
          )}

          <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-[.95fr_1.05fr]">
              <div>
                <Badge>FAQ</Badge>
                <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Questions that match common utility searches</h2>
                <p className="mt-3 max-w-xl text-lg leading-8 text-muted">The text below reflects how people usually search when they already know the job they want done.</p>
              </div>
              <div className="space-y-3">
                <details className="group rounded-2xl border border-border bg-white p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">Which tool should I use to format JSON or validate a payload?<span className="text-primary transition group-open:rotate-45">+</span></summary>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Use JSON Formatter for readable output, then move to nearby conversion or validation tools if you need CSV, YAML, or encoding help.</p>
                </details>
                <details className="group rounded-2xl border border-border bg-white p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">Do you support PDF and image utilities?<span className="text-primary transition group-open:rotate-45">+</span></summary>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Yes. Search intent like PDF merge online, PDF split, image metadata reader, or WebP converter maps to dedicated browser-side workflows.</p>
                </details>
                <details className="group rounded-2xl border border-border bg-white p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">Are the tools private and account-free?<span className="text-primary transition group-open:rotate-45">+</span></summary>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Yes. The tools are built for local browser processing and quick one-off jobs, which makes them a good fit for privacy-conscious searches.</p>
                </details>
                <details className="group rounded-2xl border border-border bg-white p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">What are the best long-tail searches for this surface?<span className="text-primary transition group-open:rotate-45">+</span></summary>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">Queries such as word counter online, UUID generator without login, CSV to JSON converter, and cron expression tester align well with the catalog and can bring in specific intent traffic.</p>
                </details>
              </div>
            </div>
          </section>

          <section id="profile" className="scroll-mt-24">
            <Card className="flex flex-col items-start justify-between gap-5 bg-gradient-to-br from-primary/[.05] to-accent/[.07] p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-primary shadow-soft"><UserRound size={20} /></span>
                <div>
                  <h2 className="text-lg font-bold">Private utility workspace</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">Favorites and recent tools stay in this browser. Cloud sync and saved dashboards are future Pro features.</p>
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
