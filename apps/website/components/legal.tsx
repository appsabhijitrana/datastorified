"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Accessibility,
  ArrowRight,
  Bot,
  CheckCircle2,
  Cookie,
  Copyright,
  Database,
  FileCheck2,
  FileText,
  Gavel,
  HeartHandshake,
  LockKeyhole,
  Mail,
  Scale,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UsersRound,
} from "lucide-react";
import { Badge, Card, Footer, Header } from "@datastorified/ui";
import {
  LEGAL_EMAIL,
  LEGAL_TEMPLATE_NOTICE,
  legalPolicies,
  legalPolicyBySlug,
  policyHref,
  type LegalPolicy,
  type PolicyIcon,
  type PolicySection,
} from "../lib/legal-content";

const iconMap = {
  privacy: LockKeyhole,
  terms: FileCheck2,
  cookies: Cookie,
  disclaimer: TriangleAlert,
  ai: Bot,
  security: ShieldCheck,
  community: UsersRound,
  acceptable: Gavel,
  sources: Database,
  copyright: Copyright,
  accessibility: Accessibility,
} satisfies Record<PolicyIcon, typeof FileText>;

export function PolicyIconMark({ icon, size = 20 }: { icon: PolicyIcon; size?: number }) {
  const Icon = iconMap[icon];
  return <Icon size={size} />;
}

export function PolicyMeta({ effectiveDate, lastUpdated }: { effectiveDate: string; lastUpdated: string }) {
  return <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
    <span><strong className="font-semibold text-ink">Effective:</strong> {effectiveDate}</span>
    <span><strong className="font-semibold text-ink">Updated:</strong> {lastUpdated}</span>
  </div>;
}

export function LegalHero({ title, summary, effectiveDate, lastUpdated, eyebrow = "Legal & Trust" }: { title: string; summary: string; effectiveDate?: string; lastUpdated?: string; eyebrow?: string }) {
  return <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/[.045] via-canvas to-canvas">
    <div className="absolute -left-32 -top-32 size-80 rounded-full bg-primary/10 blur-3xl" />
    <div className="absolute -right-24 top-8 size-72 rounded-full bg-accent/10 blur-3xl" />
    <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
      <Badge><Sparkles size={13} className="mr-1" /> {eyebrow}</Badge>
      <h1 className="mt-5 max-w-4xl text-balance text-4xl font-bold tracking-[-.04em] sm:text-5xl lg:text-6xl">{title}</h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">{summary}</p>
      {effectiveDate && lastUpdated && <div className="mt-6"><PolicyMeta effectiveDate={effectiveDate} lastUpdated={lastUpdated} /></div>}
    </div>
  </section>;
}

export function LegalTOC({ sections, desktop = false }: { sections: PolicySection[]; desktop?: boolean }) {
  const links = <>{sections.map((item) => <a key={item.id} href={`#${item.id}`} className="block rounded-lg px-3 py-2 text-sm leading-5 text-muted transition hover:bg-soft hover:text-primary">{item.title}</a>)}</>;
  return desktop ? <aside className="sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-y-auto lg:block">
    <p className="px-3 text-xs font-bold uppercase tracking-[.15em] text-muted">On this page</p>
    <nav className="mt-3">{links}</nav>
  </aside> :
    <details className="rounded-2xl border border-border bg-white p-4 shadow-soft lg:hidden">
      <summary className="cursor-pointer list-none font-semibold">Table of contents</summary>
      <nav className="mt-3 max-h-80 overflow-y-auto border-t border-border pt-2">{links}</nav>
    </details>;
}

export function LegalSection({ section: item }: { section: PolicySection }) {
  return <section id={item.id} className="scroll-mt-24 border-b border-border/80 pb-9 last:border-0">
    <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{item.title}</h2>
    <div className="mt-4 space-y-4 text-base leading-[1.8] text-muted sm:text-[17px]">
      {item.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      {item.bullets && <ul className="space-y-2 pl-1">{item.bullets.map((bullet) => <li key={bullet} className="flex gap-3"><CheckCircle2 size={18} className="mt-1 shrink-0 text-primary" /><span>{bullet}</span></li>)}</ul>}
    </div>
  </section>;
}

export function RelatedPolicies({ slugs, currentSlug }: { slugs?: string[]; currentSlug?: string }) {
  const items = (slugs ?? legalPolicies.filter((item) => item.slug !== currentSlug).slice(0, 5).map((item) => item.slug)).map(legalPolicyBySlug).filter(Boolean) as LegalPolicy[];
  return <Card className="p-5">
    <p className="text-xs font-bold uppercase tracking-[.15em] text-muted">Related policies</p>
    <div className="mt-3 space-y-1">{items.map((item) => <Link key={item.slug} href={policyHref(item.slug)} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition hover:bg-soft hover:text-primary"><span>{item.title}</span><ArrowRight size={15} /></Link>)}</div>
    <Link href="/legal" className="mt-3 inline-flex items-center gap-1 px-3 text-sm font-semibold text-primary">All legal documents <ArrowRight size={14} /></Link>
  </Card>;
}

export function LegalLayout({ policy }: { policy: LegalPolicy }) {
  return <>
    <Header />
    <main>
      <LegalHero title={policy.title} summary={policy.description} effectiveDate={policy.effectiveDate} lastUpdated={policy.lastUpdated} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <LegalTOC sections={policy.sections} />
        <div className="mt-6 grid items-start gap-8 lg:mt-0 lg:grid-cols-[220px_minmax(0,760px)] xl:grid-cols-[220px_minmax(0,760px)_240px]">
          <div className="hidden lg:block"><LegalTOC sections={policy.sections} desktop /></div>
          <article className="min-w-0 rounded-3xl border border-border bg-white p-5 shadow-soft sm:p-8 lg:p-10">
            <div className="mb-10 rounded-2xl border border-warning/20 bg-warning/[.06] p-4 text-sm leading-6 text-muted">{LEGAL_TEMPLATE_NOTICE}</div>
            <div className="space-y-9">{policy.sections.map((item) => <LegalSection key={item.id} section={item} />)}</div>
            <div className="mt-10 rounded-2xl bg-soft p-5">
              <div className="flex gap-3"><Mail size={20} className="mt-0.5 shrink-0 text-primary" /><div><h2 className="font-bold">Legal contact</h2><p className="mt-1 text-sm leading-6 text-muted">Questions about this document may be sent to <a className="font-semibold text-primary hover:underline" href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>.</p></div></div>
            </div>
          </article>
          <aside className="sticky top-24 hidden xl:block"><RelatedPolicies slugs={policy.related} currentSlug={policy.slug} /></aside>
        </div>
        <div className="mx-auto mt-8 max-w-[760px] xl:hidden"><RelatedPolicies slugs={policy.related} currentSlug={policy.slug} /></div>
      </div>
    </main>
    <Footer />
  </>;
}

export function LegalCard({ policy }: { policy: LegalPolicy }) {
  return <motion.div whileHover={{ y: -5 }} transition={{ duration: .18 }} className="h-full">
    <Link href={policyHref(policy.slug)} className="block h-full">
      <Card className="flex h-full flex-col p-6 transition hover:border-primary/20 hover:shadow-lift">
        <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary"><PolicyIconMark icon={policy.icon} /></span>
        <h2 className="mt-5 text-xl font-bold">{policy.title}</h2>
        <p className="mt-2 flex-1 text-sm leading-6 text-muted">{policy.description}</p>
        <p className="mt-5 text-xs font-medium text-muted">Updated {policy.lastUpdated}</p>
        <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">Read document <ArrowRight size={15} /></span>
      </Card>
    </Link>
  </motion.div>;
}

export function TrustCard({ icon, title, children }: { icon?: ReactNode; title: string; children: ReactNode }) {
  return <Card className="h-full p-6"><span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary">{icon ?? <ShieldCheck size={20} />}</span><h3 className="mt-4 text-lg font-bold">{title}</h3><div className="mt-2 text-sm leading-6 text-muted">{children}</div></Card>;
}

export function ContactCard({ icon, title, description, email }: { icon?: ReactNode; title: string; description: string; email: string }) {
  return <Card className="flex h-full flex-col p-6"><span className="grid size-11 place-items-center rounded-2xl bg-soft text-primary">{icon ?? <Mail size={20} />}</span><h2 className="mt-4 text-xl font-bold">{title}</h2><p className="mt-2 flex-1 text-sm leading-6 text-muted">{description}</p><a href={`mailto:${email}`} className="mt-5 inline-flex items-center gap-2 break-all text-sm font-semibold text-primary hover:underline">{email} <ArrowRight size={14} /></a></Card>;
}

export const legalVisuals = { ShieldCheck, Scale, HeartHandshake, Bot, Database, LockKeyhole, Mail };
