"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Compass, Home, Layers3, Search, Sparkles, UserRound, Wrench } from "lucide-react";
import { authClient, GoogleSignInButton } from "@datastorified/auth";
import { Badge, BrandMark, Card } from "@datastorified/ui";
import { cn } from "@datastorified/utils";

type AppShellProps = {
  children: React.ReactNode;
  showMobileNav?: boolean;
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const mobileNav: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Start", href: "/decision", icon: Sparkles },
  { label: "My Decisions", href: "/decision/saved", icon: Layers3 },
  { label: "Profile", href: "/profile", icon: UserRound },
];

const desktopNav: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "My Decisions", href: "/decision/saved", icon: Layers3 },
  { label: "Insights", href: "/insights", icon: Sparkles },
  { label: "Tools", href: "https://tools.datastorified.com", icon: Wrench },
  { label: "Profile", href: "/profile", icon: UserRound },
];

export function AppShell({ children, showMobileNav = true }: AppShellProps) {
  const pathname = usePathname() ?? "/";
  const active = pathname === "/"
    ? "home"
    : pathname.startsWith("/decision/saved")
      ? "my-decisions"
        : pathname.startsWith("/profile")
          ? "profile"
          : pathname.startsWith("/explore")
            ? "explore"
          : pathname.startsWith("/insights")
            ? "insights"
          : pathname.startsWith("/decision")
          ? "explore"
          : "";

  return (
    <div className="min-h-dvh bg-soft/30 text-ink">
      <div className="mx-auto flex min-h-dvh max-w-[1800px]">
        <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 border-r border-border/70 bg-white/95 px-5 py-5 backdrop-blur-xl lg:flex lg:flex-col">
          <Link href="/" className="flex items-center gap-3 font-bold tracking-tight">
            <BrandMark className="size-11" />
            <span className="text-lg">DataStorified</span>
          </Link>
          <nav className="mt-8 space-y-2">
            {desktopNav.map((item) => {
              const Icon = item.icon;
              const isExternal = item.href.startsWith("http");
              const isActive = !isExternal && ((item.href === "/" && active === "home") || (item.href === "/explore" && active === "explore") || (item.href === "/decision/saved" && active === "my-decisions") || (item.href === "/insights" && active === "insights") || (item.href === "/profile" && active === "profile"));
              const content = (
                <span className={cn("flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition", isActive ? "bg-primary text-white shadow-glow" : "text-muted hover:bg-soft hover:text-ink")}>
                  <Icon size={18} />
                  {item.label}
                </span>
              );
              return isExternal ? <a key={item.label} href={item.href}>{content}</a> : <Link key={item.label} href={item.href}>{content}</Link>;
            })}
          </nav>
          <Card className="mt-8 border-primary/10 bg-gradient-to-br from-primary/[.05] to-accent/[.08] p-4">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Quick start</p>
            <h2 className="mt-2 text-lg font-bold">Begin a new decision flow</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Use the guided workflow to compare options and get a transparent next step.</p>
            <Link href="/decision" className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-accent px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5">
              Start decision <ArrowRight size={16} />
            </Link>
          </Card>
        </aside>

        <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
          <TopHeader />
          <main className="min-w-0 flex-1 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-4 md:pb-10 md:pt-6">
            <div className="mx-auto min-w-0 max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
          </main>
        </div>
      </div>

      <FloatingStartButton />
      {showMobileNav && <MobileBottomNav active={active} />}
    </div>
  );
}

function TopHeader() {
  const { data: session, isPending } = authClient.useSession();
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-6">
        <Link href="/" className="flex items-center gap-3 font-bold tracking-tight">
          <BrandMark className="size-10" />
          <span>DataStorified</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/decision#search" className="hidden min-h-11 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-muted shadow-soft transition hover:border-primary/30 hover:text-ink sm:inline-flex">
            <Search size={16} />
            Search launcher
          </Link>
          {isPending ? (
            <Badge>Checking account…</Badge>
          ) : session?.user ? (
            <Link href="/profile" className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-white px-3 text-sm font-semibold shadow-soft">
              <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {(session.user.name ?? session.user.email ?? "A").slice(0, 2).toUpperCase()}
              </span>
              <span className="hidden sm:inline">{session.user.name ?? session.user.email ?? "Account"}</span>
            </Link>
          ) : (
            <GoogleSignInButton className="min-h-11 px-4">
              <UserRound size={16} />
              <span className="hidden sm:inline">Sign in with Google</span>
            </GoogleSignInButton>
          )}
        </div>
      </div>
    </header>
  );
}

function FloatingStartButton() {
  return (
    <Link href="/decision" className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-40 md:bottom-6">
      <span className="inline-flex min-h-14 items-center gap-2 rounded-full bg-gradient-to-br from-primary to-accent px-5 text-sm font-bold text-white shadow-glow">
        <Sparkles size={16} />
        Start decision
      </span>
    </Link>
  );
}

function MobileBottomNav({ active }: { active: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-white/95 px-2 pb-[max(.65rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-0.5 px-1">
        {mobileNav.map((item) => {
          const Icon = item.icon;
          const isActive =
            (item.label === "Home" && active === "home") ||
            (item.label === "Explore" && active === "explore") ||
            (item.label === "Start" && active === "explore") ||
            (item.label === "My Decisions" && active === "my-decisions") ||
            (item.label === "Profile" && active === "profile");
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition",
                isActive ? "bg-primary/10 text-primary" : "text-muted",
              )}
            >
              <Icon size={19} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
