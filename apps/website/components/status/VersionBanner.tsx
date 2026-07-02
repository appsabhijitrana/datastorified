"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, BadgeAlert } from "lucide-react";
import { Button, Card } from "@datastorified/ui";
import { cn } from "@datastorified/utils";

const VERSION_BANNER_KEY = "ds.status.version.seen";

export function VersionBanner({ version }: { version: string }) {
  const [seenVersion, setSeenVersion] = useState<string | null>(null);

  useEffect(() => {
    try {
      setSeenVersion(window.localStorage.getItem(VERSION_BANNER_KEY));
    } catch {
      setSeenVersion(null);
    }
  }, []);

  const visible = version && seenVersion !== version;

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-16 z-40 px-4 py-3 sm:px-6 md:top-16">
      <Card className={cn("mx-auto flex max-w-7xl flex-col gap-3 border-primary/15 bg-white/95 p-4 shadow-lift backdrop-blur sm:flex-row sm:items-center sm:justify-between")}>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <BadgeAlert size={16} />
          </span>
          <div>
            <p className="font-semibold text-ink">You’re viewing version {version}</p>
            <p className="mt-1 text-sm leading-6 text-muted">We’ve refreshed the app since your last visit. Review what changed before you continue.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              try {
                window.localStorage.setItem(VERSION_BANNER_KEY, version);
              } catch {
                // Ignore storage failures.
              }
              setSeenVersion(version);
            }}
          >
            Got it
          </Button>
          <a href="/status">
            <Button variant="ghost">
              Release status <ArrowUpRight size={16} />
            </Button>
          </a>
        </div>
      </Card>
    </div>
  );
}

