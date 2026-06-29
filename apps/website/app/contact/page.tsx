import { BriefcaseBusiness, Gavel, LifeBuoy, Mail, MessageSquareText, ShieldCheck } from "lucide-react";
import { Footer, Header } from "@datastorified/ui";
import { createMetadata } from "@datastorified/seo";
import { ContactCard, LegalHero } from "../../components/legal";

export const metadata = createMetadata("Contact DataStorified", "Contact DataStorified for general questions, support, legal, security, partnerships, or product feedback.", "datastorified.com", "/contact");

const contacts = [
  { icon: <Mail size={20} />, title: "General", description: "Questions about DataStorified, the product direction, or where to find something.", email: "hello@datastorified.com" },
  { icon: <LifeBuoy size={20} />, title: "Support", description: "Help with a calculator, utility, local workspace, or unexpected product behavior.", email: "support@datastorified.com" },
  { icon: <Gavel size={20} />, title: "Legal", description: "Policy questions, formal notices, privacy matters, or intellectual-property concerns.", email: "legal@datastorified.com" },
  { icon: <ShieldCheck size={20} />, title: "Security", description: "Private, good-faith vulnerability reports and security concerns.", email: "security@datastorified.com" },
  { icon: <BriefcaseBusiness size={20} />, title: "Partnerships", description: "Data, distribution, creator, platform, or product collaboration proposals.", email: "partnerships@datastorified.com" },
  { icon: <MessageSquareText size={20} />, title: "Feedback", description: "Corrections, feature ideas, accessibility barriers, and ways to make decisions clearer.", email: "feedback@datastorified.com" },
];

export default function ContactPage() {
  return <>
    <Header />
    <main>
      <LegalHero eyebrow="Contact" title="Talk to the right team" summary="Choose the closest topic so your message reaches the right place. Please avoid sending passwords, payment credentials, health records, or unnecessary sensitive data by email." />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20"><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{contacts.map((item) => <ContactCard key={item.title} {...item} />)}</div></section>
    </main>
    <Footer />
  </>;
}
