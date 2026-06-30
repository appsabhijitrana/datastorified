import Link from "next/link";
import { Bot, Database, Eye, LockKeyhole, SlidersHorizontal, UserRoundCheck } from "lucide-react";
import { Button, Card, Footer, Header } from "@datastorified/ui";
import { createMetadata } from "@datastorified/seo";
import { LegalHero, TrustCard } from "../../components/legal";

export const metadata = createMetadata("Trust Center | DataStorified", "Learn how DataStorified approaches privacy, security, AI transparency, local storage, data sources, and user control.", "datastorified.com", "/trust");

const principles = [
  { icon: <LockKeyhole size={20} />, title: "Privacy first", body: "We minimize collection and keep calculator, tool, favorite, recent, and draft data on your device wherever practical." },
  { icon: <UserRoundCheck size={20} />, title: "Security", body: "Managed HTTPS infrastructure, limited data movement, dependency maintenance, and a responsible disclosure channel reduce avoidable risk." },
  { icon: <Bot size={20} />, title: "AI transparency", body: "Mocked, rules-based, and future AI-generated output should be distinguishable. AI assists decisions; it does not become the authority." },
  { icon: <Database size={20} />, title: "Local storage", body: "Phase 1 workspace data uses browser-local `ds.*` keys. Clearing site data removes it, and anyone sharing the browser profile may access it." },
  { icon: <Eye size={20} />, title: "Data sources", body: "Material methods and assumptions are explained, external sources should show freshness, and AI explanations are never treated as primary sources." },
  { icon: <SlidersHorizontal size={20} />, title: "User control", body: "No login wall is required for exploration. You can clear local data, avoid optional transfers, verify results, and choose whether to act." },
];

export default function TrustPage() {
  return <>
    <Header />
    <main>
      <LegalHero eyebrow="Trust Center" title="Trust is a product decision" summary="DataStorified is designed to make important assumptions visible, keep data local when possible, and leave final decisions in your hands." />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{principles.map((item) => <TrustCard key={item.title} icon={item.icon} title={item.title}>{item.body}</TrustCard>)}</div>
        <Card className="mt-12 overflow-hidden border-0 bg-gradient-to-br from-primary to-accent p-7 text-white shadow-glow sm:p-10">
          <div className="grid items-center gap-7 md:grid-cols-[1fr_auto]"><div><p className="text-sm font-semibold text-white/70">Responsible disclosure</p><h2 className="mt-2 text-3xl font-bold">Found a security concern?</h2><p className="mt-3 max-w-2xl leading-7 text-white/75">Check the official contact page for the currently supported private reporting method. Please avoid accessing other users’ data or disrupting service.</p></div><Link href="/contact#contact-intake"><Button variant="secondary">Security contact status</Button></Link></div>
        </Card>
        <div className="mt-12 text-center"><h2 className="text-3xl font-bold">Read the policies behind the promises</h2><p className="mx-auto mt-3 max-w-2xl leading-7 text-muted">Our legal hub covers privacy, security, AI disclosure, data sources, acceptable use, and accessibility in detail.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/legal"><Button>Open legal hub</Button></Link><Link href="/legal/privacy"><Button variant="secondary">Privacy policy</Button></Link><Link href="/legal/security"><Button variant="secondary">Security policy</Button></Link></div></div>
      </section>
    </main>
    <Footer />
  </>;
}
