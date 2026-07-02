"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient, signOut } from "../client";
import type { LegalAcceptanceMarker, LegalAcceptanceStatus } from "@datastorified/legal";
import {
  buildPendingAcceptanceMarker,
  buildLegalAcceptanceInput,
  parseLegalAcceptanceMarker,
  CURRENT_LEGAL_VERSIONS,
} from "@datastorified/legal";
import { TermsAcceptanceModal } from "./TermsAcceptanceModal";

const pendingKey = "ds.legal.acceptance.pending";

type LegalAcceptanceGateProps = {
  children?: React.ReactNode;
  mode?: "global" | "account";
};

async function fetchStatus(): Promise<LegalAcceptanceStatus> {
  const response = await fetch("/api/legal/acceptance/status", { credentials: "include" });
  if (!response.ok) {
    return {
      acceptedCurrentTerms: true,
      acceptedCurrentPrivacy: true,
      acceptedCurrentLegal: true,
      requiresAcceptance: false,
      currentVersions: CURRENT_LEGAL_VERSIONS,
    };
  }
  return (await response.json()) as LegalAcceptanceStatus;
}

async function persistAcceptance(marker: LegalAcceptanceMarker) {
  const response = await fetch("/api/legal/acceptance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(buildLegalAcceptanceInput(marker)),
  });
  if (!response.ok) {
    throw new Error("Unable to persist legal acceptance.");
  }
}

export function LegalAcceptanceGate({ children, mode = "global" }: LegalAcceptanceGateProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [statusLoaded, setStatusLoaded] = useState(!session?.user);
  const [requiresAcceptance, setRequiresAcceptance] = useState(false);
  const [open, setOpen] = useState(false);
  const [pendingMarker, setPendingMarker] = useState<LegalAcceptanceMarker | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!session?.user) {
      setStatusLoaded(true);
      setRequiresAcceptance(false);
      setOpen(false);
      setPendingMarker(null);
      return () => {
        cancelled = true;
      };
    }

    setStatusLoaded(false);

    let marker: LegalAcceptanceMarker | null = null;
    try {
      marker = parseLegalAcceptanceMarker(window.sessionStorage.getItem(pendingKey));
    } catch {
      marker = null;
    }
    setPendingMarker(marker);

    if (marker) {
      void persistAcceptance(marker)
        .then(() => {
          try {
            window.sessionStorage.removeItem(pendingKey);
          } catch {
            // ignore storage issues
          }
          if (cancelled) return;
          setRequiresAcceptance(false);
          setOpen(false);
          router.refresh();
        })
        .catch(() => {
          if (cancelled) return;
          setRequiresAcceptance(true);
          setOpen(true);
        })
        .finally(() => {
          if (!cancelled) setStatusLoaded(true);
        });
      return () => {
        cancelled = true;
      };
    }

    void fetchStatus()
      .then((status) => {
        if (cancelled) return;
        setRequiresAcceptance(status.requiresAcceptance);
        setOpen(status.requiresAcceptance);
      })
      .catch(() => {
        if (cancelled) return;
        setRequiresAcceptance(true);
        setOpen(true);
      })
      .finally(() => {
        if (!cancelled) setStatusLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  if (!session?.user) {
    return <>{children ?? null}</>;
  }

  if (!statusLoaded) {
    return null;
  }

  if (!requiresAcceptance) {
    return <>{children ?? null}</>;
  }

  return (
    <TermsAcceptanceModal
      open={open}
      mode={mode === "account" ? "account" : "account"}
      onClose={async () => {
        await signOut();
        router.push("/");
      }}
      continueLabel="Accept and continue"
      onContinue={async () => {
        const marker = pendingMarker ?? buildPendingAcceptanceMarker(new Date().toISOString());
        await persistAcceptance(marker);
        try {
          window.sessionStorage.removeItem(pendingKey);
        } catch {
          // ignore
        }
        setOpen(false);
        setRequiresAcceptance(false);
        router.refresh();
      }}
    />
  );
}
