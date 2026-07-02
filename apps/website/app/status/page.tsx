import Link from "next/link";
import { Badge, Card } from "@datastorified/ui";
import { StatusService } from "../../lib/status/service";
import { formatSystemStatus } from "../../lib/status/format";
import { ServiceStatusGrid } from "../../components/status/ServiceStatusGrid";
import { IncidentTimeline } from "../../components/status/IncidentTimeline";

export default function Page() {
  const maintenance = StatusService.getMaintenance();
  const health = StatusService.getHealth();
  const services = StatusService.getServices();
  const incidents = StatusService.getIncidents();

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <Card className="p-6 sm:p-8">
          <Badge>{formatSystemStatus(health.systemStatus)}</Badge>
          <h1 className="mt-4 text-4xl font-bold tracking-[-.04em] text-ink sm:text-5xl">Status page</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">Live service health for DataStorified. We keep this page public so users can quickly see whether the website, API, auth, database, and decision engine are healthy.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted">Version</p>
              <p className="mt-2 text-lg font-bold text-ink">{health.version}</p>
            </div>
            <div className="rounded-2xl bg-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted">Updated</p>
              <p className="mt-2 text-lg font-bold text-ink">{new Date(health.timestamp).toLocaleString("en-IN")}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/maintenance" className="text-sm font-semibold text-primary hover:underline">Open maintenance page</Link>
            <Link href="/" className="text-sm font-semibold text-primary hover:underline">Back to home</Link>
          </div>
        </Card>
        <Card className="p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-muted">Maintenance</p>
          <h2 className="mt-2 text-2xl font-bold text-ink">{maintenance.enabled ? "Enabled" : "Disabled"}</h2>
          <p className="mt-3 text-sm leading-6 text-muted">{maintenance.message}</p>
          {maintenance.eta && <p className="mt-3 text-sm font-medium text-muted">ETA: {new Date(maintenance.eta).toLocaleString("en-IN")}</p>}
        </Card>
      </section>

      <section className="mt-10">
        <div className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-[.14em] text-primary">Services</p>
          <h2 className="mt-2 text-2xl font-bold text-ink">Component status</h2>
        </div>
        <ServiceStatusGrid services={services} />
      </section>

      <section className="mt-10">
        <div className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-[.14em] text-primary">Incidents</p>
          <h2 className="mt-2 text-2xl font-bold text-ink">Recent updates</h2>
        </div>
        <IncidentTimeline incidents={incidents} />
      </section>
    </main>
  );
}

