"use client";

import * as React from "react";
import { Calculator, Sparkles, UserRound } from "lucide-react";
import { calculators, searchCalculators } from "../../../../packages/calculators-engine/registry";
import { storage } from "@datastorified/storage";
import { trackFavorite, trackSearch } from "@datastorified/analytics";
import { Badge, Button, CalculatorCard, Card, CategorySection, EmptyState, Footer, Header, SearchBox } from "@datastorified/ui";

export default function CalculatorsHomeClient() {
  const [q, setQ] = React.useState("");
  const [recent, setRecent] = React.useState<string[]>([]);
  const [favs, setFavs] = React.useState<string[]>([]);
  const [searches, setSearches] = React.useState<string[]>([]);

  React.useEffect(() => {
    setRecent(storage.getRecent("calculators"));
    setFavs(storage.getFavorites("calculators"));
    setSearches(storage.getSearches());
  }, []);

  const found = React.useMemo(() => searchCalculators(q), [q]);
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
  const sections = [...new Set(calculators.map((item) => item.category))];

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
              {!q && searches.length > 0 ? <div className="mt-3 flex flex-wrap justify-center gap-2">{searches.slice(0, 5).map((x) => <button key={x} onClick={() => setQ(x)} className="rounded-full border border-border bg-white/80 px-3 py-1.5 text-sm text-muted transition hover:border-primary/30 hover:text-primary">{x}</button>)}</div> : null}
            </div>
          </div>
        </section>
        <div className="mx-auto max-w-7xl space-y-16 px-4 py-14 sm:px-6">
          {q ? (
            <CategorySection title={`${found.length} result${found.length === 1 ? "" : "s"} for “${q}”`}>
              {found.length ? <Grid items={found} favs={favs} toggle={toggle} /> : <EmptyState title="No calculator found" />}
            </CategorySection>
          ) : (
            <>
              <CategorySection title="Popular calculators" description="The questions people are working through right now">
                <Grid items={calculators.filter((item) => item.popular)} favs={favs} toggle={toggle} />
              </CategorySection>
              {recent.length > 0 ? <CategorySection id="recent" title="Recently used" description="Pick up where you left off"><Grid items={recent.map((slug) => calculators.find((item) => item.slug === slug)).filter(Boolean) as typeof calculators} favs={favs} toggle={toggle} /></CategorySection> : null}
              {favs.length > 0 ? <CategorySection title="Your favorites"><Grid items={favs.map((slug) => calculators.find((item) => item.slug === slug)).filter(Boolean) as typeof calculators} favs={favs} toggle={toggle} /></CategorySection> : null}
              <div id="categories" className="space-y-16">
                {sections.map((category) => <CategorySection key={category} title={category}><Grid items={calculators.filter((item) => item.category === category)} favs={favs} toggle={toggle} /></CategorySection>)}
              </div>
            </>
          )}
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
    </>
  );
}

function Grid({ items, favs, toggle }: { items: typeof calculators; favs: string[]; toggle: (slug: string) => void }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map((item) => <CalculatorCard key={item.slug} name={item.name} description={item.description} category={item.category} href={`/calculators/${item.slug}`} favorite={favs.includes(item.slug)} onFavorite={() => toggle(item.slug)} icon={<Calculator size={20} />} />)}</div>;
}
