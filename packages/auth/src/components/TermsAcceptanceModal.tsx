"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { LEGAL_LINKS } from "@datastorified/legal";
import { Dialog } from "../../../../packages/ui/design-system";
import { cn } from "@datastorified/utils";

type TermsAcceptanceModalProps = {
  open: boolean;
  mode?: "signin" | "account";
  onClose: () => void;
  onContinue: () => void | Promise<void>;
  continueLabel?: string;
};

export function TermsAcceptanceModal({ open, mode = "signin", onClose, onContinue, continueLabel }: TermsAcceptanceModalProps) {
  const checkboxId = React.useId();
  const descriptionId = React.useId();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setChecked(false);
  }, [open, onClose]);

  if (!open) return null;

  const accept = async () => {
    if (!checked || busy) return;
    setBusy(true);
    try {
      await onContinue();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} title={mode === "signin" ? "Before you continue" : "Please review and accept the terms"} onClose={onClose}>
      <div aria-describedby={descriptionId} className="space-y-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{mode === "signin" ? "Before you continue" : "One more step"}</p>
        <p id={descriptionId} className="text-sm leading-6 text-muted">
          {mode === "signin"
            ? "Please review and accept DataStorified’s terms before creating your account."
            : "To keep using cloud and account features, please confirm the current legal terms."}
        </p>

        <div className="mt-5 rounded-2xl border border-border bg-soft/35 p-4">
          <label htmlFor={checkboxId} className="flex cursor-pointer items-start gap-3">
            <input
              id={checkboxId}
              type="checkbox"
              checked={checked}
              onChange={(event) => setChecked(event.target.checked)}
              className="mt-1 size-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm leading-6 text-ink">
              I agree to DataStorified’s Terms of Service, Privacy Policy, Cookie Policy, Disclaimer, and AI Disclosure.
            </span>
          </label>

          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {LEGAL_LINKS.map((link: (typeof LEGAL_LINKS)[number]) => (
              <Link key={link.href} href={link.href} className="rounded-full bg-white px-3 py-1.5 text-muted shadow-soft hover:text-primary">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-soft hover:border-primary/30"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!checked || busy}
            onClick={() => void accept()}
            className={cn(
              "inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-glow",
              checked && !busy ? "bg-gradient-to-br from-primary to-accent" : "cursor-not-allowed bg-primary/40",
            )}
          >
            {busy ? "Please wait…" : continueLabel ?? (mode === "signin" ? "Continue with Google" : "Accept and continue")}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
