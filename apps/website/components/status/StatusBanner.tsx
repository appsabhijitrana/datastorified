"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronRight, Clock3, Info } from "lucide-react";
import { Badge, Button } from "@datastorified/ui";
import { cn } from "@datastorified/utils";
import type { BannerConfig } from "../../lib/status/types";
import { getStatusTone } from "../../lib/status/format";

const BANNER_DISMISS_KEY = "ds.status.banner.dismissed";

function useLocalBannerDismissal(version: string): [boolean, () => void] {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(BANNER_DISMISS_KEY) === version);
    } catch {
      setDismissed(false);
    }
  }, [version]);

  const dismiss = () => {
    try {
      window.localStorage.setItem(BANNER_DISMISS_KEY, version);
    } catch {
      // Ignore storage failures.
    }
    setDismissed(true);
  };

  return [dismissed, dismiss];
}

export function StatusBanner({ banner }: { banner: BannerConfig }) {
  const [dismissed, dismiss] = useLocalBannerDismissal(banner.version);
  const tone = getStatusTone(banner.level);
  const icon = useMemo(() => {
    if (banner.level === "critical") return <AlertTriangle size={16} />;
    if (banner.level === "info") return <Info size={16} />;
    return <Clock3 size={16} />;
  }, [banner.level]);

  if (!banner.enabled || dismissed) return null;

  return (
    <div className={cn("border-b px-4 py-3 sm:px-6", tone === "critical" ? "border-danger/20 bg-danger/[.08]" : tone === "warning" ? "border-warning/20 bg-warning/[.08]" : "border-primary/15 bg-primary/[.06]")}>
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-full", tone === "critical" ? "bg-danger/10 text-danger" : tone === "warning" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary")}>{icon}</span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn(tone === "critical" ? "border-danger/20 bg-danger/10 text-danger" : tone === "warning" ? "border-warning/20 bg-warning/10 text-warning" : "border-primary/20 bg-primary/10 text-primary")}>{banner.level.toUpperCase()}</Badge>
              <p className="font-semibold text-ink">{banner.title}</p>
            </div>
            <p className="mt-1 text-sm leading-6 text-muted">{banner.message}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={banner.link} className="inline-flex">
            <Button variant="secondary">
              View status <ChevronRight size={16} />
            </Button>
          </Link>
          <Button variant="ghost" onClick={dismiss}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
