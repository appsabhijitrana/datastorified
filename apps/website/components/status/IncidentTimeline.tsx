import { Card } from "@datastorified/ui";
import type { Incident } from "../../lib/status/types";

function formatIncidentStatus(status: Incident["status"]): string {
  switch (status) {
    case "investigating":
      return "Investigating";
    case "identified":
      return "Identified";
    case "monitoring":
      return "Monitoring";
    case "resolved":
      return "Resolved";
    case "completed":
      return "Completed";
    default:
      return status;
  }
}

export function IncidentTimeline({ incidents }: { incidents: Incident[] }) {
  if (!incidents.length) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-bold text-ink">Incidents</h2>
        <p className="mt-2 text-sm leading-6 text-muted">No open incidents are listed right now.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {incidents.map((incident) => (
        <Card key={incident.id} className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-ink">{incident.title}</h3>
              <p className="mt-1 text-sm text-muted">{incident.message}</p>
            </div>
            <span className="rounded-full bg-soft px-3 py-1 text-xs font-semibold text-muted">{formatIncidentStatus(incident.status)}</span>
          </div>
          <p className="mt-4 text-xs text-muted">Service: {incident.service} · {new Date(incident.timestamp).toLocaleString("en-IN")}</p>
        </Card>
      ))}
    </div>
  );
}
