import type { ReactNode } from "react";
import type { DecisionAnswers, DecisionReport, DecisionWorkflow } from "@datastorified/decision-os";
import type { ProfileAnalysis } from "@datastorified/profile";

export type WorkflowResultConfig = {
  workflowId?: string;
  sections?: Partial<Record<ResultSectionKey, boolean>>;
  relatedDecisionSlugs?: string[];
  disclaimerType?: "none" | "finance" | "insurance" | "legal" | "health";
};

export type ResultSectionKey =
  | "summary"
  | "score_breakdown"
  | "trade_offs"
  | "scenario_simulator"
  | "action_plan"
  | "disclaimer"
  | "save_share"
  | "review_reminder"
  | "related_decisions";

export type ResultSectionLayoutProps = {
  title: string;
  description?: string;
  kicker?: string;
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
};

export type ResultDataAdapterInput = {
  workflow: DecisionWorkflow;
  report: DecisionReport;
  answers?: DecisionAnswers;
  config?: WorkflowResultConfig;
  saved?: boolean;
  copied?: boolean;
  profileAnalysis?: Pick<ProfileAnalysis, "label" | "description" | "nextBestField" | "percentage">;
  onCopy?: () => void;
  onShare?: () => void;
  onPrint?: () => void;
  onRevisit?: () => void;
  onSave?: () => void;
};

export type ResultDataAdapterOutput = ResultDataAdapterInput & {
  config: WorkflowResultConfig;
  safeDisclaimer: string;
  safeSummary: string;
};
