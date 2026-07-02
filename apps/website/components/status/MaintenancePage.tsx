import React from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button, Card } from "@datastorified/ui";
import type { MaintenanceConfig } from "../../lib/status/types";

export function MaintenancePage({ maintenance }: { maintenance: MaintenanceConfig }) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center px-4 py-16 sm:px-6">
      <Card className="w-full rounded-[2rem] border-0 bg-gradient-to-br from-primary/[.06] to-warning/[.08] p-6 shadow-lift sm:p-10">
        <div className="grid size-14 place-items-center rounded-2xl bg-white text-primary shadow-soft">
          <ShieldAlert size={24} />
        </div>
        <h1 className="mt-6 text-balance text-4xl font-bold tracking-[-.04em] text-ink sm:text-5xl">We’ll be back shortly</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted">{maintenance.message}</p>
        <div className="mt-6 flex flex-wrap gap-2 text-sm text-muted">
          {maintenance.start && <span className="rounded-full bg-white px-3 py-1.5 shadow-soft">Started {new Date(maintenance.start).toLocaleString("en-IN")}</span>}
          {maintenance.end && <span className="rounded-full bg-white px-3 py-1.5 shadow-soft">Expected by {new Date(maintenance.end).toLocaleString("en-IN")}</span>}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/">
            <Button variant="secondary">Back to home</Button>
          </Link>
          <Link href="/status">
            <Button variant="ghost">View status</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
