import { Card, Badge } from "@datastorified/ui";
import { getStatusTone, formatServiceState } from "../../lib/status/format";
import type { ServiceStatus } from "../../lib/status/types";
import { cn } from "@datastorified/utils";

export function ServiceStatusGrid({ services }: { services: ServiceStatus[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {services.map((service) => {
        const tone = getStatusTone(service.state);
        return (
          <Card key={service.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-ink">{service.name}</h3>
                <p className="mt-1 text-sm leading-6 text-muted">{service.description}</p>
              </div>
              <Badge className={cn(tone === "critical" ? "border-danger/20 bg-danger/10 text-danger" : tone === "warning" ? "border-warning/20 bg-warning/10 text-warning" : tone === "success" ? "border-success/20 bg-success/10 text-success" : "border-primary/20 bg-primary/10 text-primary")}>
                {formatServiceState(service.state)}
              </Badge>
            </div>
            <p className="mt-4 text-xs text-muted">Updated {new Date(service.updatedAt).toLocaleString("en-IN")}</p>
          </Card>
        );
      })}
    </div>
  );
}

