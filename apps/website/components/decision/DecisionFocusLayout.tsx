"use client";

import { ArrowLeft, Save, X } from "lucide-react";
import { Button, Card } from "@datastorified/ui";
import { BottomSheet } from "@datastorified/ui/design-system";

export function DecisionFocusLayout({
  title,
  onBack,
  onSaveAndExit,
  onExitWithoutSaving,
  onContinue,
  exitOpen,
  children,
  dirty = false,
}: {
  title: string;
  onBack: () => void;
  onSaveAndExit: () => void | Promise<void>;
  onExitWithoutSaving: () => void;
  onContinue: () => void;
  exitOpen: boolean;
  dirty?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" className="min-h-11 px-0 text-sm font-semibold text-muted" onClick={onBack}>
          <ArrowLeft size={16} />
          Close
        </Button>
        <Button variant="secondary" className="min-h-11 px-3 text-sm font-semibold" onClick={onSaveAndExit}>
          <Save size={16} />
          Save
        </Button>
      </div>

      <Card className="border-primary/15 bg-white/90 p-4 shadow-soft sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Focused decision mode</p>
            <h1 className="mt-2 text-balance text-2xl font-bold tracking-[-.03em] sm:text-4xl">{title}</h1>
          </div>
          {dirty ? <span className="inline-flex min-h-8 items-center rounded-full border border-warning/15 bg-warning/10 px-3 text-xs font-semibold text-warning">Unsaved changes</span> : <span className="inline-flex min-h-8 items-center rounded-full border border-success/15 bg-success/10 px-3 text-xs font-semibold text-success">Saved</span>}
        </div>
      </Card>

      {children}

      <ExitConfirmationSheet
        open={exitOpen}
        dirty={dirty}
        onSaveAndExit={onSaveAndExit}
        onExitWithoutSaving={onExitWithoutSaving}
        onContinue={onContinue}
      />
    </div>
  );
}

export function SaveAndExitAction({
  onClick,
  disabled,
}: {
  onClick: () => void | Promise<void>;
  disabled?: boolean;
}) {
  return (
    <Button variant="secondary" className="min-h-11" onClick={onClick} disabled={disabled}>
      <Save size={16} />
      Save & exit
    </Button>
  );
}

export function ExitConfirmationSheet({
  open,
  dirty,
  onSaveAndExit,
  onExitWithoutSaving,
  onContinue,
}: {
  open: boolean;
  dirty: boolean;
  onSaveAndExit: () => void | Promise<void>;
  onExitWithoutSaving: () => void;
  onContinue: () => void;
}) {
  return (
    <BottomSheet open={open} title="Leave this decision?" onClose={onContinue}>
      <div className="space-y-4">
        <p className="text-sm leading-6 text-muted">
          {dirty ? "Save this draft before leaving?" : "You can leave without saving if nothing changed."}
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <Button onClick={onSaveAndExit} disabled={!dirty}>
            <Save size={16} />
            Save & exit
          </Button>
          <Button variant="secondary" onClick={onExitWithoutSaving}>
            <X size={16} />
            Exit without saving
          </Button>
          <Button variant="ghost" onClick={onContinue}>
            Continue decision
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
