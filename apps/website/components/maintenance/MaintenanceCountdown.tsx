"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "../../lib/status/format";

export function MaintenanceCountdown({ eta }: { eta?: string }) {
  const [remaining, setRemaining] = useState<string | null>(null);

  useEffect(() => {
    if (!eta) return;
    const target = new Date(eta).getTime();
    if (Number.isNaN(target)) return;

    const update = () => {
      setRemaining(formatCountdown(target - Date.now()));
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [eta]);

  if (!eta) return null;

  return <p className="mt-3 text-sm font-medium text-muted">{remaining ? `Expected back in ${remaining}` : `Expected by ${new Date(eta).toLocaleString("en-IN")}`}</p>;
}

