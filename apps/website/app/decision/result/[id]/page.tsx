import type { Metadata } from "next";
import { DecisionResultPage } from "../../../../components/decision/DecisionResultPage";
import { AppShell } from "../../../../components/shell/AppShell";

export const metadata: Metadata = {
  title: "Private Decision Result | DataStorified",
  description: "A private decision result stored only in this browser.",
  alternates: { canonical: null },
  robots: {
    index: false,
    follow: false,
    nosnippet: true,
    noimageindex: true,
    googleBot: { index: false, follow: false, nosnippet: true, noimageindex: true },
  },
};

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AppShell showMobileNav={false}><DecisionResultPage id={id} /></AppShell>;
}
