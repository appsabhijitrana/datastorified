"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Compass, Home, Layers3, Search, Sparkles, TrendingUp, UserRound } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@datastorified/utils";
import { Badge, Button, Card, ProgressBar, Skeleton } from "./design-system";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

export function AppShell({
  children,
  sidebar,
  title,
  subtitle,
  searchPlaceholder = "Search...",
  onSearch,
}: {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
}) {
  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <div className="mx-auto flex min-h-dvh max-w-[1800px]">
        <Sidebar title={title} subtitle={subtitle} items={defaultSidebarItems} extra={sidebar} />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="sticky top-0 z-40 border-b border-border/70 bg-white/85 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
              <div className="min-w-0 flex-1">
                <TopSearchBar placeholder={searchPlaceholder} onSearch={onSearch} />
              </div>
            </div>
          </div>
          <main className="min-w-0 flex-1 pb-[calc(6.75rem+env(safe-area-inset-bottom))] pt-4 md:pb-10 md:pt-6">
            <div className="mx-auto min-w-0 max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
          </main>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}

export function Sidebar({ title, subtitle, items = defaultSidebarItems, extra }: { title?: string; subtitle?: string; items?: NavItem[]; extra?: React.ReactNode }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-80 shrink-0 border-r border-border/70 bg-white/95 px-5 py-5 backdrop-blur-xl lg:flex lg:flex-col">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">DataStorified</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{title ?? "Decision dashboard"}</h1>
        {subtitle ? <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p> : null}
      </div>
      <nav className="mt-8 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-muted transition hover:bg-soft hover:text-ink">
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {extra ? <div className="mt-8">{extra}</div> : null}
    </aside>
  );
}

export function TopSearchBar({ placeholder, onSearch }: { placeholder?: string; onSearch?: (value: string) => void }) {
  const [value, setValue] = React.useState("");
  return (
    <div className="flex items-center gap-3 rounded-[1.5rem] border border-border/80 bg-white px-4 py-3 shadow-soft focus-within:border-primary/40 focus-within:shadow-glow">
      <Search className="shrink-0 text-muted" size={18} />
      <input
        aria-label={placeholder ?? "Search"}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && onSearch) onSearch(value);
        }}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted/70"
      />
      <Button variant="secondary" onClick={() => onSearch?.(value)}>
        Search
      </Button>
    </div>
  );
}

export function BottomNavigation({ active = "home" }: { active?: string }) {
  const items = [
    { key: "home", label: "Home", href: "/", icon: Home },
    { key: "explore", label: "Explore", href: "/explore", icon: Compass },
    { key: "library", label: "Library", href: "/my-decisions", icon: Layers3 },
    { key: "insights", label: "Insights", href: "/insights", icon: TrendingUp },
    { key: "profile", label: "Profile", href: "/profile", icon: UserRound },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white/95 px-2 pb-[max(.65rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-0.5 px-1">
        {items.map(({ key, label, href, icon: Icon }) => (
          <Link
            key={key}
            href={href}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-[11px] font-semibold transition",
              active === key ? "bg-primary/10 text-primary" : "text-muted hover:bg-soft hover:text-ink",
            )}
          >
            <Icon size={19} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function MetricCard({ title, value, detail, icon }: { title: string; value: string; detail?: string; icon?: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
        </div>
        {icon ? <span className="ds-icon-wrap">{icon}</span> : null}
      </div>
      {detail ? <p className="mt-3 text-sm leading-6 text-muted">{detail}</p> : null}
    </Card>
  );
}

export function InsightCard({ title = "Insight", children }: { title?: string; children: React.ReactNode }) {
  return (
    <Card className="border-primary/15 bg-gradient-to-br from-primary/[.06] to-accent/[.08] p-5">
      <div className="flex items-start gap-3">
        <span className="ds-icon-wrap"><BarChart3 size={18} /></span>
        <div>
          <p className="font-semibold text-ink">{title}</p>
          <div className="mt-1 text-sm leading-6 text-muted">{children}</div>
        </div>
      </div>
    </Card>
  );
}

export function DecisionCard({ title, description, category, href, actionLabel = "Start" }: { title: string; description: string; category: string; href: string; actionLabel?: string }) {
  return (
    <Link href={href} className="block h-full">
      <Card className="flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
        <Badge>{category}</Badge>
        <h3 className="mt-3 text-lg font-bold tracking-tight">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
        <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-primary">
          {actionLabel}
          <ArrowRight size={16} />
        </span>
      </Card>
    </Link>
  );
}

export function TrendingDecisionCard(props: { title: string; description: string; category: string; href: string }) {
  return <DecisionCard {...props} actionLabel="Trending start" />;
}

export function ContinueDecisionCard(props: { title: string; description: string; category: string; href: string }) {
  return <DecisionCard {...props} actionLabel="Continue" />;
}

export function CategoryCard(props: { title: string; description: string; href: string }) {
  return <DecisionCard {...props} category="Category" actionLabel="Explore" />;
}

export function RecommendationCard(props: { title: string; description: string; category: string; href: string; reason?: string }) {
  return (
    <Card className="flex h-full flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <Badge>{props.category}</Badge>
        {props.reason ? <Badge className="border-border bg-soft text-muted">{props.reason}</Badge> : null}
      </div>
      <div>
        <h3 className="text-lg font-bold">{props.title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{props.description}</p>
      </div>
      <Link href={props.href} className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-semibold text-primary">
        Start
        <ArrowRight size={16} />
      </Link>
    </Card>
  );
}

export function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-semibold text-muted">{title}</p>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

export function ProgressRing({ value, label, size = 96, tone = "primary" }: { value: number; label?: string; size?: number; tone?: "primary" | "accent" | "success" | "warning" | "danger" }) {
  const safe = Math.max(0, Math.min(100, value));
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safe / 100) * circumference;
  const ringClass = {
    primary: "stroke-primary",
    accent: "stroke-accent",
    success: "stroke-emerald-500",
    warning: "stroke-amber-500",
    danger: "stroke-danger",
  }[tone];
  return (
    <div className="relative grid place-items-center transition-transform duration-300 hover:-translate-y-0.5" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={radius} className="stroke-border/40" strokeWidth="10" fill="none" />
        <circle cx="50" cy="50" r={radius} className={ringClass} strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold">{safe}</div>
        {label ? <div className="text-xs font-semibold text-muted">{label}</div> : null}
      </div>
    </div>
  );
}

export const ScoreRing = ProgressRing;

export function MiniLineChart({ points }: { points: number[] }) {
  const safe = points.length ? points : [0, 0, 0, 0, 0];
  const max = Math.max(...safe, 1);
  return (
    <div className="flex h-20 items-end gap-2">
      {safe.slice(-6).map((point, index) => (
        <span
          key={`${index}-${point}`}
          className="flex-1 rounded-t-full bg-gradient-to-t from-primary to-accent"
          style={{ height: `${Math.max(10, (point / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export function ComparisonBar({ leftLabel, rightLabel, leftValue, rightValue }: { leftLabel: string; rightLabel: string; leftValue: number; rightValue: number }) {
  const total = Math.max(leftValue + rightValue, 1);
  const leftPercent = (leftValue / total) * 100;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">{leftLabel}</span>
        <span className="text-muted">{rightLabel}</span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-soft">
        <span className="bg-gradient-to-r from-primary to-accent" style={{ width: `${leftPercent}%` }} />
        <span className="bg-soft/20" style={{ width: `${100 - leftPercent}%` }} />
      </div>
    </div>
  );
}

export function ConfidenceMeter({ value, label = "Confidence", hint }: { value: number; label?: string; hint?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">{label}</p>
          <p className="mt-2 text-3xl font-bold">{Math.round(value)}%</p>
          {hint ? <p className="mt-2 text-sm leading-6 text-muted">{hint}</p> : null}
        </div>
        <ProgressRing value={value} size={96} tone="accent" />
      </div>
      <ProgressBar className="mt-4" value={value} />
    </Card>
  );
}

export function RiskMeter({ value, label = "Risk", hint }: { value: number; label?: string; hint?: string }) {
  const percent = Math.max(0, Math.min(100, value));
  const tone = percent >= 70 ? "danger" : percent >= 40 ? "warning" : "success";
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">{label}</p>
          <p className="mt-2 text-3xl font-bold">{Math.round(percent)}%</p>
          {hint ? <p className="mt-2 text-sm leading-6 text-muted">{hint}</p> : null}
        </div>
        <ProgressRing value={percent} size={96} tone={tone} />
      </div>
      <ProgressBar className="mt-4" value={percent} />
    </Card>
  );
}

export function ScenarioProjectionChart({ data, title = "Scenario projection", description }: { data: Array<{ label: string; value: number }>; title?: string; description?: string }) {
  const safeData = data.length ? data : [{ label: "Now", value: 0 }];
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted">{title}</p>
          {description ? <p className="mt-1 text-sm leading-6 text-muted">{description}</p> : null}
        </div>
      </div>
      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={safeData}>
            <defs>
              <linearGradient id="scenarioFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgb(37 99 235)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="rgb(37 99 235)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148,163,184,.18)" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "rgb(100 116 139)", fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "rgb(100 116 139)", fontSize: 12 }} />
            <Tooltip cursor={{ stroke: "rgba(37,99,235,.2)" }} />
            <Area type="monotone" dataKey="value" stroke="rgb(37 99 235)" strokeWidth={3} fill="url(#scenarioFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function KPITrendIndicator({ label, value, delta, tone = "primary" }: { label: string; value: string; delta: string; tone?: "primary" | "success" | "warning" | "danger" }) {
  const toneClass = {
    primary: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-amber-700 bg-amber-500/10",
    danger: "text-danger bg-danger/10",
  }[tone];
  return (
    <Card className="p-4">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-2xl font-bold">{value}</p>
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", toneClass)}>{delta}</span>
      </div>
    </Card>
  );
}

export function FactorScoreBar({ label, value, hint, tone = "primary" }: { label: string; value: number; hint?: string; tone?: "primary" | "accent" | "success" | "warning" | "danger" }) {
  const percent = Math.max(0, Math.min(100, value));
  const barClass = {
    primary: "from-primary to-accent",
    accent: "from-accent to-violet-500",
    success: "from-success to-emerald-500",
    warning: "from-amber-500 to-amber-400",
    danger: "from-danger to-rose-500",
  }[tone];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-ink">{label}</span>
        <span className="text-muted">{Math.round(percent)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-soft">
        <div className={cn("h-full rounded-full bg-gradient-to-r transition-[width] duration-500", barClass)} style={{ width: `${percent}%` }} />
      </div>
      {hint ? <p className="text-xs leading-5 text-muted">{hint}</p> : null}
    </div>
  );
}

export function BarComparisonChart({ title, leftLabel, rightLabel, leftValue, rightValue }: { title?: string; leftLabel: string; rightLabel: string; leftValue: number; rightValue: number }) {
  const total = Math.max(leftValue + rightValue, 1);
  const data = [
    { label: leftLabel, value: leftValue, fill: "rgb(37 99 235)" },
    { label: rightLabel, value: rightValue, fill: "rgb(124 58 237)" },
  ];
  return (
    <Card className="p-5">
      {title ? <p className="text-sm font-semibold text-muted">{title}</p> : null}
      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barSize={32}>
            <CartesianGrid stroke="rgba(148,163,184,.18)" horizontal={false} />
            <XAxis type="number" hide domain={[0, total]} />
            <YAxis type="category" dataKey="label" width={90} tickLine={false} axisLine={false} tick={{ fill: "rgb(100 116 139)", fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[0, 999, 999, 0]}>
              {data.map((entry) => (
                <Cell key={entry.label} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function useMockTrendData(base = 30, count = 6) {
  return React.useMemo(
    () => Array.from({ length: count }, (_, index) => ({ label: `W${index + 1}`, value: Math.max(8, base + Math.round(Math.sin(index * 1.2) * 12) + index * 4) })),
    [base, count],
  );
}

export function SkeletonLoader({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, index) => <Skeleton key={index} className={index === 0 ? "h-6 w-2/3" : "h-4 w-full"} />)}
    </div>
  );
}

export function PremiumCTA({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel: string; onAction: () => void }) {
  return (
    <Card className="border-primary/15 bg-gradient-to-br from-primary/[.05] to-accent/[.08] p-5">
      <div className="flex items-start gap-3">
        <span className="ds-icon-wrap"><Sparkles size={18} /></span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
          <Button className="mt-4" variant="secondary" onClick={onAction}>{actionLabel}</Button>
        </div>
      </div>
    </Card>
  );
}

export function AIInsightCard({ title = "AI insight", children }: { title?: string; children: React.ReactNode }) {
  return (
    <Card className="border-primary/15 bg-gradient-to-br from-primary/[.05] to-accent/[.08] p-5">
      <div className="flex items-start gap-3">
        <span className="ds-icon-wrap"><Sparkles size={18} /></span>
        <div>
          <p className="font-semibold text-ink">{title}</p>
          <div className="mt-1 text-sm leading-6 text-muted">{children}</div>
        </div>
      </div>
    </Card>
  );
}

const defaultSidebarItems: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "My Decisions", href: "/my-decisions", icon: Layers3 },
  { label: "Insights", href: "/insights", icon: TrendingUp },
  { label: "Profile", href: "/profile", icon: UserRound },
];
