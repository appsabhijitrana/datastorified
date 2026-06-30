import { BriefcaseBusiness, Gavel, LifeBuoy, Mail, MessageSquareText, ShieldCheck } from "lucide-react";
import { Footer, Header } from "@datastorified/ui";
import { createMetadata } from "@datastorified/seo";
import { ContactCard, LegalHero } from "../../components/legal";

export const metadata = createMetadata("Contact DataStorified", "Contact DataStorified for general questions, support, legal, security, partnerships, or product feedback.", "datastorified.com", "/contact");

const contacts = [
  { icon: <Mail size={20} />, title: "General", description: "Questions about DataStorified, the product direction, or where to find something." },
  { icon: <LifeBuoy size={20} />, title: "Support", description: "Help with a calculator, utility, local workspace, or unexpected product behavior." },
  { icon: <Gavel size={20} />, title: "Legal", description: "Policy questions, formal notices, privacy matters, copyright, or intellectual-property concerns." },
  { icon: <ShieldCheck size={20} />, title: "Security", description: "Private, good-faith vulnerability reports and security concerns." },
  { icon: <BriefcaseBusiness size={20} />, title: "Partnerships", description: "Data, distribution, creator, platform, or product collaboration proposals." },
  { icon: <MessageSquareText size={20} />, title: "Feedback", description: "Corrections, feature ideas, accessibility barriers, and ways to make decisions clearer." },
];

export default function ContactPage() {
  return <>
    <Header />
    <main>
      <LegalHero eyebrow="Contact" title="Official contact information" summary="This page is the authoritative location for DataStorified contact channels. Dedicated email inboxes are not currently published, so addresses shown elsewhere should not be treated as valid." />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20"><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{contacts.map((item) => <ContactCard key={item.title} {...item} />)}</div><div id="contact-intake" role="status" className="mt-8 rounded-2xl border border-warning/20 bg-warning/[.06] p-5 text-sm leading-6 text-muted"><strong className="text-ink">Contact intake status:</strong> No public electronic submission channel is active yet. Before sending a formal, privacy, security, copyright, or accessibility request, return to this page for the currently supported method. Never send passwords, payment credentials, health records, or exploit data through an unverified channel.</div></section>
    </main>
    <Footer />
  </>;
}
