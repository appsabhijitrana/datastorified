"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Download, Link2, Printer, BookmarkPlus, Trash2 } from "lucide-react";
import { Button, Card, Dialog } from "@datastorified/ui/design-system";
import type { DecisionReport, DecisionWorkflow } from "@datastorified/decision-os";
import { safeCopyForType } from "./ResultDataAdapter";

export function CopySummaryButton({ summary, onCopy }: { summary: string; onCopy?: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        await navigator.clipboard.writeText(summary);
        setCopied(true);
        onCopy?.();
        window.setTimeout(() => setCopied(false), 1200);
      }}
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {copied ? "Copied" : "Copy summary"}
    </Button>
  );
}

export function SaveReportButton({
  saved,
  onToggleSave,
}: {
  saved: boolean;
  onToggleSave: () => void;
}) {
  return (
    <Button variant="secondary" onClick={onToggleSave}>
      {saved ? <Trash2 size={16} /> : <BookmarkPlus size={16} />}
      {saved ? "Remove saved copy" : "Save locally"}
    </Button>
  );
}

export function PrintReportButton({ onPrint }: { onPrint: () => void }) {
  return (
    <Button variant="secondary" onClick={onPrint}>
      <Printer size={16} />
      Print
    </Button>
  );
}

export function ExportReportButton({ report, workflow, summary, disclaimerType = "none" }: { report: DecisionReport; workflow: DecisionWorkflow; summary: string; disclaimerType?: "none" | "finance" | "insurance" | "legal" | "health" }) {
  return (
    <Button
      variant="secondary"
      onClick={() => {
        const html = buildPrintableHtml({ workflow, report, summary, disclaimerType });
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${workflow.slug}-report.html`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }}
    >
      <Download size={16} />
      Export
    </Button>
  );
}

export function ShareReportSheet({
  open,
  onClose,
  workflow,
  report,
  summary,
  onCopySummary,
  onCopyLink,
  onPrint,
  onExport,
  disclaimerType = "none",
}: {
  open: boolean;
  onClose: () => void;
  workflow: DecisionWorkflow;
  report: DecisionReport;
  summary: string;
  onCopySummary?: () => void;
  onCopyLink?: () => void;
  onPrint: () => void;
  onExport: () => void;
  disclaimerType?: "none" | "finance" | "insurance" | "legal" | "health";
}) {
  const shareCopy = useMemo(() => safeCopyForType(disclaimerType), [disclaimerType]);
  return (
    <Dialog open={open} title="Share report" onClose={onClose}>
      <div className="space-y-4">
        <Card className="border-border bg-soft/40 p-4">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Summary only</p>
          <p className="mt-2 text-sm leading-6 text-muted">{shareCopy}</p>
        </Card>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="secondary" onClick={onCopySummary}><Copy size={16} /> Copy summary</Button>
          <Button variant="secondary" onClick={onCopyLink}><Link2 size={16} /> Copy link</Button>
          <Button variant="secondary" onClick={onPrint}><Printer size={16} /> Print</Button>
          <Button variant="secondary" onClick={onExport}><Download size={16} /> Export HTML</Button>
        </div>
        <Card className="p-4">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Preview</p>
          <p className="mt-2 text-sm font-semibold text-ink">{workflow.title}</p>
          <p className="mt-1 text-xs text-muted">Generated {new Date(report.generatedAt).toLocaleString("en-IN")}</p>
          <p className="mt-1 text-sm leading-6 text-muted">{summary}</p>
          <p className="mt-2 text-xs text-muted">Shared content avoids raw answers and private profile data.</p>
        </Card>
      </div>
    </Dialog>
  );
}

function buildPrintableHtml({
  workflow,
  report,
  summary,
  disclaimerType,
}: {
  workflow: DecisionWorkflow;
  report: DecisionReport;
  summary: string;
  disclaimerType: "none" | "finance" | "insurance" | "legal" | "health";
}) {
  const disclaimer = safeCopyForType(disclaimerType);
  const tradeOffs = report.recommendation?.actions?.length ? report.recommendation.actions : report.actionPlan;
  const tradeOffList = tradeOffs.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const actionList = report.actionPlan.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(workflow.title)} Report</title>
  <style>
    body { font-family: Inter, system-ui, sans-serif; margin: 40px; color: #0f172a; }
    h1, h2 { margin: 0 0 12px; }
    .meta, .muted { color: #64748b; }
    .card { border: 1px solid #e2e8f0; border-radius: 18px; padding: 16px; margin: 16px 0; }
    ul { margin: 12px 0 0 20px; }
    li { margin: 8px 0; line-height: 1.5; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(workflow.title)}</h1>
  <p class="meta">Generated ${new Date(report.generatedAt).toLocaleString("en-IN")}</p>
  <div class="card">
    <h2>Summary</h2>
    <p>${escapeHtml(summary).replace(/\n/g, "<br/>")}</p>
  </div>
  <div class="card">
    <h2>Score</h2>
    <p><strong>${Math.round(report.score.value)}/100</strong> ${escapeHtml(report.score.label ?? "Decision profile")}</p>
  </div>
  <div class="card">
    <h2>Trade-offs</h2>
    <ul>${tradeOffList || "<li>Trade-off detail is limited for this workflow.</li>"}</ul>
  </div>
  <div class="card">
    <h2>Action checklist</h2>
    <ul>${actionList || "<li>Review assumptions before acting.</li>"}</ul>
  </div>
  <div class="card">
    <h2>Disclaimer</h2>
    <p class="muted">${escapeHtml(disclaimer)}</p>
  </div>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
