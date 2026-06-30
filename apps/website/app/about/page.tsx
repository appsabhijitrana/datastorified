import { Bot, ChartNoAxesCombined, Eye, LockKeyhole, Smartphone, Target } from "lucide-react";
import { Card, Footer, Header } from "@datastorified/ui";
import { createMetadata } from "@datastorified/seo";
import { LegalHero, TrustCard } from "../../components/legal";

export const metadata = createMetadata("About DataStorified | Decision Intelligence for Everyone", "Learn why DataStorified brings decision guidance, visual calculators, and private utilities into one mobile-first platform.", "datastorified.com", "/about");

const principles = [
  { icon: <ChartNoAxesCombined size={20} />, title: "Data-backed decisions", body: "Turn assumptions into visible inputs, comparisons, and scenarios instead of relying on vague confidence." },
  { icon: <Eye size={20} />, title: "Transparency", body: "Show methods, limitations, sources, and uncertainty clearly enough that users can challenge the result." },
  { icon: <Smartphone size={20} />, title: "Mobile-first access", body: "Make thoughtful tools comfortable on the device people already have, without dense interfaces or ad clutter." },
  { icon: <LockKeyhole size={20} />, title: "Privacy by design", body: "Keep work local and account-free when the product does not genuinely need server-side identity or storage." },
  { icon: <Bot size={20} />, title: "AI as assistance, not authority", body: "Use AI to explain and organize, while keeping verification, judgment, and responsibility with people." },
];

export default function AboutPage() {
  return <>
    <Header />
    <main>
      <LegalHero eyebrow="About DataStorified" title="Decision Intelligence for Everyone" summary="A calm, mobile-first platform for turning everyday uncertainty into measurable trade-offs, useful calculations, and clearer next steps." />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <Card className="mb-8 overflow-hidden bg-gradient-to-br from-primary/[.035] via-white to-accent/[.05] p-6 sm:p-10">
          <img className="mx-auto h-auto w-full max-w-2xl" src="/brand/logo-lockup.png" alt="DataStorified — Decision Intelligence for Everyone" />
        </Card>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6 sm:p-8"><span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white"><Target size={22} /></span><h2 className="mt-5 text-2xl font-bold">Why it exists</h2><p className="mt-3 text-[17px] leading-8 text-muted">Important decisions are often buried under fragmented information, unexplained formulas, and tools optimized for advertising rather than understanding. DataStorified exists to make the useful questions, numbers, and trade-offs easier to see.</p></Card>
          <Card className="p-6 sm:p-8"><span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary"><ChartNoAxesCombined size={22} /></span><h2 className="mt-5 text-2xl font-bold">What it offers</h2><p className="mt-3 text-[17px] leading-8 text-muted">The Decision Engine frames a question. Calculators make assumptions measurable. Utilities remove small workflow friction. Together they create a workspace that helps people move from uncertainty to an informed next action.</p></Card>
        </div>
        <div className="mt-16 text-center"><p className="text-sm font-bold uppercase tracking-[.16em] text-primary">Our principles</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">Useful software should earn confidence</h2></div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{principles.map((item) => <TrustCard key={item.title} icon={item.icon} title={item.title}>{item.body}</TrustCard>)}</div>
      </section>
    </main>
    <Footer />
  </>;
}
