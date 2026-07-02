"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../client";
import type { LegalAcceptanceStatus, LegalAcceptanceMarker } from "@datastorified/legal";
import { buildPendingAcceptanceMarker, buildLegalAcceptanceInput, parseLegalAcceptanceMarker, CURRENT_LEGAL_VERSIONS } from "@datastorified/legal";
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
  const [requiresAcceptance, setRequiresAcceptance] = useState(false);
  const [open, setOpen] = useState(false);
  const [statusLoaded, setStatusLoaded] = useState(mode === "global");
  const [pendingMarker, setPendingMarker] = useState<LegalAcceptanceMarker | null>(null);

  useEffect(() => {
    try {
      setPendingMarker(parseLegalAcceptanceMarker(window.sessionStorage.getItem(pendingKey)));
    } catch {
      setPendingMarker(null);
    }
  }, [session?.user]);

  useEffect(() => {
    const marker = parseLegalAcceptanceMarker(window.sessionStorage.getItem(pendingKey));
    if (!session?.user || !marker) return;
    void persistAcceptance(marker).finally(() => {
      try {
        window.sessionStorage.removeItem(pendingKey);
      } catch {
        // ignore
      }
    });
  }, [session?.user]);

  useEffect(() => {
    if (mode !== "account" || !session?.user) {
      setStatusLoaded(true);
      setRequiresAcceptance(false);
      return;
    }
    setStatusLoaded(false);
    void fetchStatus()
      .then((status) => {
        setRequiresAcceptance(status.requiresAcceptance);
        setOpen(status.requiresAcceptance);
      })
      .finally(() => setStatusLoaded(true));
  }, [mode, session?.user]);

  if (mode !== "account") return <>{children ?? null}</>;

  return (
    <>
      <div className={open ? "pointer-events-none select-none opacity-50" : ""}>{children}</div>
      {session?.user && statusLoaded && requiresAcceptance && (
        <TermsAcceptanceModal
          open={open}
          mode="account"
          onClose={() => router.push("/")}
          continueLabel="Accept and continue"
          onContinue={async () => {
            const marker = pendingMarker ?? buildPendingAcceptanceMarker(new Date().toISOString());
            await persistAcceptance(marker);
            setOpen(false);
            setRequiresAcceptance(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
