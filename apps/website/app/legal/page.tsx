import { Footer, Header } from "@datastorified/ui";
import { createMetadata } from "@datastorified/seo";
import { LegalCard, LegalHero } from "../../components/legal";
import { legalPolicies, LEGAL_TEMPLATE_NOTICE } from "../../lib/legal-content";

export const metadata = createMetadata("Legal & Trust | DataStorified", "Explore DataStorified policies covering privacy, terms, cookies, AI transparency, security, acceptable use, data sources, copyright, and accessibility.", "datastorified.com", "/legal");

export default function LegalHubPage() {
  return <>
    <Header />
    <main>
      <LegalHero title="Legal documents, written for humans" summary="Clear policies for a privacy-first decision platform. Understand how DataStorified works, what you control, and the responsibilities that come with using the service." />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mb-8 max-w-3xl rounded-2xl border border-warning/20 bg-warning/[.06] p-4 text-sm leading-6 text-muted">{LEGAL_TEMPLATE_NOTICE}</div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{legalPolicies.map((item) => <LegalCard key={item.slug} policy={item} />)}</div>
      </section>
    </main>
    <Footer />
  </>;
}

