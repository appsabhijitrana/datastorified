"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { authClient } from "@datastorified/auth";
import { Button, Card } from "@datastorified/ui";
import type { DecisionProfile, ProfilePromptRule, ProgressiveProfileField } from "@datastorified/profile";
import { getNextProfilePrompt, getLocalProfilePromptRules, markProgressiveProfileField } from "@datastorified/profile";
import { trackPrivacySafeProfileEvent } from "@datastorified/analytics";

type ProgressiveProfileNudgeProps = {
  context?: string;
  profile?: DecisionProfile | null;
  title?: string;
  description?: string;
  onSkip?: () => void;
  onSaved?: () => void;
};

export function ProgressiveProfileNudge({ context, profile, title, description, onSkip, onSaved }: ProgressiveProfileNudgeProps) {
  const { data: session } = authClient.useSession();
  const prompt = useMemo(() => getNextProfilePrompt(profile, context), [context, profile]);
  const rules = getLocalProfilePromptRules();
  const [saved, setSaved] = useState(false);
  const rule = useMemo(
    () => (prompt ? rules.find((item) => item.label === prompt.title || item.benefit === prompt.benefit) : undefined),
    [prompt, rules],
  );

  if (!prompt || !rule) return null;

  return (
    <ProfilePromptCard
      rule={rule}
      title={title ?? getPromptHeadline(context, rule.field)}
      description={description ?? rule.benefit}
      sessionState={session?.user ? "Signed in with Google to sync later." : "Anonymous mode keeps this stored locally first."}
      onSave={(value) => {
        const didSave = markProgressiveProfileField(rule.field, Array.isArray(value) ? value.join(", ") : value);
        setSaved(didSave);
        trackPrivacySafeProfileEvent("profile_progress_saved", {
          profile_source: session?.user ? "cloud" : "local",
          prompt_field: rule.field,
          prompt_context: context,
          is_logged_in: Boolean(session?.user),
        });
        if (didSave) onSaved?.();
      }}
      onSkip={() => {
        trackPrivacySafeProfileEvent("profile_prompt_skipped", {
          profile_source: session?.user ? "cloud" : "local",
          prompt_field: rule.field,
          prompt_context: context,
          is_logged_in: Boolean(session?.user),
        });
        onSkip?.();
      }}
      saved={saved}
    />
  );
}

export function ProfilePromptCard({
  rule,
  title,
  description,
  sessionState,
  onSave,
  onSkip,
  saved = false,
}: {
  rule: ProfilePromptRule;
  title: string;
  description: string;
  sessionState: string;
  onSave: (value: string | number | boolean | string[] | null) => void;
  onSkip: () => void;
  saved?: boolean;
}) {
  return (
    <Card className="border-primary/15 bg-gradient-to-br from-primary/[.05] to-accent/[.07] p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-primary shadow-sm">
          <Sparkles size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Improve confidence</p>
          <h3 className="mt-1 text-lg font-bold">{title}</h3>
          <ProfileBenefitCopy benefit={description} reason={rule.reason} sessionState={sessionState} />
          <div className="mt-4">
            <ProfileFieldMiniForm field={rule.field} onSave={onSave} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => onSave(getDefaultValue(rule.field))}>
              Save locally <ArrowRight size={16} />
            </Button>
            <SkipProfilePromptButton onSkip={onSkip} />
            {saved && <span className="inline-flex min-h-10 items-center rounded-full border border-success/15 bg-success/10 px-3 text-sm font-semibold text-success">Saved locally</span>}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ProfileFieldMiniForm({
  field,
  onSave,
}: {
  field: ProgressiveProfileField;
  onSave: (value: string | number | boolean | string[] | null) => void;
}) {
  const [value, setValue] = useState<string>(""); 
  const options = getOptions(field);

  if (options) {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSave(option.value)}
            className="min-h-11 rounded-2xl border border-border bg-white px-4 py-3 text-left text-sm font-semibold text-ink transition hover:border-primary/30 hover:bg-primary/[.04]"
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-label={field}
        placeholder={getPlaceholder(field)}
        className="min-h-11 min-w-0 flex-1 rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
      />
      <Button variant="secondary" onClick={() => onSave(value.trim() || null)}>
        Save <CheckCircle2 size={16} />
      </Button>
    </div>
  );
}

export function SkipProfilePromptButton({ onSkip }: { onSkip: () => void }) {
  return (
    <Button variant="ghost" onClick={onSkip} className="min-h-11 px-4">
      Skip
    </Button>
  );
}

export function ProfileBenefitCopy({ benefit, reason, sessionState }: { benefit: string; reason: string; sessionState: string }) {
  return (
    <div className="mt-2 space-y-1 text-sm leading-6 text-muted">
      <p>{benefit}</p>
      <p>{reason}</p>
      <p className="text-xs font-medium text-muted">{sessionState}</p>
    </div>
  );
}

function getPromptHeadline(context: string | undefined, field: ProgressiveProfileField) {
  if (context === "money") return "Add your risk comfort to improve money decision confidence.";
  if (context === "home") return "Add your city to improve rent, buy, and cost-of-living analysis.";
  if (context === "career") return "Add your career stage to improve career decision suggestions.";
  if (context === "buying") return "Add your budget comfort to improve buying comparisons.";
  return `Add your ${formatField(field)} to improve future decision confidence.`;
}

function formatField(field: ProgressiveProfileField) {
  return field.replace(/([A-Z])/g, " $1").toLowerCase();
}

function getDefaultValue(field: ProgressiveProfileField) {
  if (field === "goals") return ["compare more carefully"];
  if (field === "dependents") return 0;
  if (field === "investmentExperience") return "beginner";
  if (field === "riskComfort") return "moderate";
  if (field === "careerStage") return "early_career";
  if (field === "homeOwnership") return "renting";
  return "";
}

function getOptions(field: ProgressiveProfileField) {
  if (field === "ageRange") return [
    { label: "18-24", value: "18-24" },
    { label: "25-34", value: "25-34" },
    { label: "35-44", value: "35-44" },
    { label: "45+", value: "45-54" },
  ];
  if (field === "riskComfort") return [
    { label: "Low", value: "low" },
    { label: "Moderate", value: "moderate" },
    { label: "Balanced", value: "balanced" },
    { label: "Growth", value: "growth" },
  ];
  if (field === "careerStage") return [
    { label: "Student", value: "student" },
    { label: "Early career", value: "early_career" },
    { label: "Mid career", value: "mid_career" },
    { label: "Senior", value: "senior" },
  ];
  if (field === "homeOwnership") return [
    { label: "Renting", value: "renting" },
    { label: "Owning", value: "owning" },
    { label: "Planning", value: "planning" },
  ];
  if (field === "investmentExperience") return [
    { label: "None", value: "none" },
    { label: "Beginner", value: "beginner" },
    { label: "Intermediate", value: "intermediate" },
    { label: "Advanced", value: "advanced" },
  ];
  return null;
}

function getPlaceholder(field: ProgressiveProfileField) {
  if (field === "city") return "Enter your city";
  if (field === "incomeRange") return "Enter an income range";
  if (field === "goals") return "Enter a goal";
  if (field === "dependents") return "Number of dependents";
  return `Enter ${formatField(field)}`;
}
