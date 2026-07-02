import Link from "next/link";
import { Badge, Card } from "@datastorified/ui";
import { StatusService } from "../../lib/status/service";

export default function Page() {
  const health = StatusService.getHealth();

  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
      <Card className="rounded-[2rem] border-0 bg-gradient-to-br from-primary/[.06] to-soft p-6 sm:p-10">
        <Badge>{health.status === "maintenance" ? "Quiet mode" : health.status === "notice" ? "Notice" : "All clear"}</Badge>
        <h1 className="mt-4 text-4xl font-bold tracking-[-.04em] text-ink sm:text-5xl">Status</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
          {health.message ?? "Everything is moving normally. If we need to share a note, we’ll keep it short and clear."}
        </p>
        <div className="mt-6 flex flex-wrap gap-2 text-sm text-muted">
          <span className="rounded-full bg-white px-3 py-1.5 shadow-soft">Version {health.version}</span>
          <span className="rounded-full bg-white px-3 py-1.5 shadow-soft">Updated {new Date(health.timestamp).toLocaleString("en-IN")}</span>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/">
            <span className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-soft">Back to home</span>
          </Link>
          <Link href="/maintenance">
            <span className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-soft">Open maintenance page</span>
          </Link>
        </div>
      </Card>
    </main>
  );
}

