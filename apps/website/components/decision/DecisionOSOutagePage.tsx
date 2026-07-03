import React from "react";
import { ShieldAlert } from "lucide-react";
import { Button, Card } from "@datastorified/ui";
import Link from "next/link";

export function DecisionOSOutagePage({ message }: { message?: string }) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center px-4 py-16 sm:px-6">
      <Card className="w-full rounded-[2rem] border-0 bg-gradient-to-br from-warning/[.08] to-primary/[.06] p-6 shadow-lift sm:p-10">
        <div className="grid size-14 place-items-center rounded-2xl bg-white text-primary shadow-soft">
          <ShieldAlert size={24} />
        </div>
        <h1 className="mt-6 text-balance text-4xl font-bold tracking-[-.04em] text-ink sm:text-5xl">Decision OS is temporarily unavailable</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
          {message || "We are currently experiencing an issue with our cloud-based decision services. We are working to resolve this as soon as possible."}
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Your existing local decisions are safe and accessible. You can continue to work on them or start new ones that will be saved locally. Full functionality will be restored once the outage is resolved.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/decision/saved">
            <Button variant="secondary">View saved decisions</Button>
          </Link>
          <Link href="/">
            <Button variant="secondary">Back to home</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
