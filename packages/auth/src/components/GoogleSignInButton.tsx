"use client";

import React, { useMemo, useState } from "react";
import { buildPendingAcceptanceMarker, serializeLegalAcceptanceMarker } from "@datastorified/legal";
import { cn } from "@datastorified/utils";
import { signInWithGoogle } from "../client";
import { TermsAcceptanceModal } from "./TermsAcceptanceModal";

type GoogleSignInButtonProps = {
  callbackURL?: string;
  className?: string;
  children?: React.ReactNode;
};

const pendingKey = "ds.legal.acceptance.pending";

function writePendingAcceptance() {
  try {
    window.sessionStorage.setItem(pendingKey, serializeLegalAcceptanceMarker(buildPendingAcceptanceMarker(new Date().toISOString())));
  } catch {
    // ignore storage issues
  }
}

export function GoogleSignInButton({ callbackURL, className, children }: GoogleSignInButtonProps) {
  const [open, setOpen] = useState(false);
  const label = useMemo(() => children ?? "Sign in with Google", [children]);
  const resolvedCallbackURL = useMemo(
    () => callbackURL ?? (typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}${window.location.hash}` : "/"),
    [callbackURL],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-soft transition hover:border-primary/30",
          className,
        )}
      >
        {label}
      </button>
      <TermsAcceptanceModal
        open={open}
        onClose={() => setOpen(false)}
        onContinue={async () => {
          writePendingAcceptance();
          setOpen(false);
          await signInWithGoogle({ callbackURL: resolvedCallbackURL });
        }}
      />
    </>
  );
}
