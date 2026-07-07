"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { LEGAL_LINKS } from "@datastorified/legal";
import { cn } from "@datastorified/utils";

type TermsAcceptanceModalProps = {
  open: boolean;
  mode?: "signin" | "account";
  onClose: () => void;
  onContinue: () => void | Promise<void>;
  continueLabel?: string;
};

export function TermsAcceptanceModal({ open, mode = "signin", onClose, onContinue, continueLabel }: TermsAcceptanceModalProps) {
  const checkboxId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setChecked(false);
    const timer = window.setTimeout(() => dialogRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
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
    <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/40 px-4 py-6 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="w-full max-w-lg rounded-[2rem] border border-border bg-white p-5 shadow-lift outline-none sm:p-7"
      >
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{mode === "signin" ? "Before you continue" : "One more step"}</p>
        <h2 id={titleId} className="mt-2 text-2xl font-bold tracking-[-.03em] text-ink">
          {mode === "signin" ? "Before you continue" : "Please review and accept the terms"}
        </h2>
        <p id={descriptionId} className="mt-3 text-sm leading-6 text-muted">
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
    </div>
  );
}
