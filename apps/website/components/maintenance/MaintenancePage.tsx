import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock3 } from "lucide-react";
import { Badge, Button, Card } from "@datastorified/ui";
import { MaintenanceCountdown } from "./MaintenanceCountdown";
import type { MaintenanceConfig } from "../../lib/status/types";

export function MaintenancePage({ maintenance }: { maintenance: MaintenanceConfig }) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center px-4 py-16 sm:px-6">
      <Card className="w-full overflow-hidden border-warning/20 bg-gradient-to-br from-warning/[.08] to-primary/[.05] p-6 sm:p-10">
        <Badge className="border-warning/20 bg-warning/10 text-warning">
          <AlertTriangle size={14} className="mr-1" />
          Scheduled maintenance
        </Badge>
        <h1 className="mt-5 text-balance text-4xl font-bold tracking-[-.04em] text-ink sm:text-5xl">DataStorified is temporarily unavailable</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted">{maintenance.message}</p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-ink shadow-soft">
          <Clock3 size={16} className="text-primary" />
          {maintenance.eta ? `Target ETA: ${new Date(maintenance.eta).toLocaleString("en-IN")}` : "We’ll restore access as soon as the update is complete."}
        </div>
        <MaintenanceCountdown eta={maintenance.eta} />
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/status">
            <Button variant="secondary">
              View status page <ArrowRight size={16} />
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost">Back to home</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}

