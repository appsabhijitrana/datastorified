"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, PencilLine, RefreshCcw, Shield, Trash2 } from "lucide-react";
import { authClient, GoogleSignInButton } from "@datastorified/auth";
import { Badge, Button, Card } from "@datastorified/ui";
import { localDecisionStorage } from "@datastorified/decision-os";
import { getDecisionAdapters } from "@datastorified/decision-os/adapters";
import { removeLocalProfileField, saveLocalProfile } from "@datastorified/profile";
import { getProfileAnalysis, type DecisionProfile } from "@datastorified/profile";
import { getDecisionConfidence, DecisionConfidenceCard, MissingSignalList, ProfileCompletenessImpact } from "../decision/DecisionConfidence";
import { ProgressiveProfileNudge } from "./ProgressiveProfileNudge";
import { ProfileCompletenessCard } from "./ProfileCompletenessCard";

type EditableField = {
  key: keyof DecisionProfile;
  label: string;
  benefit: string;
  type?: "text" | "number" | "select" | "multiselect";
  options?: readonly string[];
};

const PROFILE_FIELDS: readonly EditableField[] = [
  { key: "ageRange", label: "Age range", benefit: "Helps calibrate life-stage assumptions.", options: ["under-18", "18-24", "25-34", "35-44", "45-54", "55-64", "65-plus"] },
  { key: "city", label: "City", benefit: "Improves cost-of-living and location-sensitive comparisons." },
  { key: "incomeRange", label: "Income range", benefit: "Improves affordability and budgeting comparisons." },
  { key: "riskComfort", label: "Risk comfort", benefit: "Improves uncertainty handling and preview confidence.", options: ["low", "moderate", "balanced", "growth", "high"] },
  { key: "dependents", label: "Dependents", benefit: "Improves family-context decisions.", type: "number" },
  { key: "careerStage", label: "Career stage", benefit: "Improves career decision suggestions.", options: ["student", "early_career", "mid_career", "senior", "business_owner", "retired"] },
  { key: "goals", label: "Goals", benefit: "Helps prioritize the decisions that matter most.", type: "multiselect" },
  { key: "homeOwnership", label: "Home ownership", benefit: "Improves rent, buy, and housing comparison context.", options: ["renting", "owning", "planning", "prefer_not_to_say"] },
  { key: "investmentExperience", label: "Investment experience", benefit: "Improves money decision nuance.", options: ["none", "beginner", "intermediate", "advanced", "expert"] },
  { key: "employmentType", label: "Employment type", benefit: "Improves stability and cash-flow assumptions.", options: ["student", "employed", "self-employed", "contract", "freelance", "business-owner", "unemployed", "retired", "homemaker", "other"] },
  { key: "preferredCurrency", label: "Preferred currency", benefit: "Improves value formatting.", type: "text" },
  { key: "preferredLanguage", label: "Preferred language", benefit: "Improves future copy and explanation clarity.", type: "text" },
];

export function ProfilePageContent() {
  const { data: session } = authClient.useSession();
  const adapters = useMemo(() => getDecisionAdapters(), []);
  const [profile, setProfile] = useState<DecisionProfile | null>(null);
  const [editingField, setEditingField] = useState<keyof DecisionProfile | null>(null);
  const [draftValue, setDraftValue] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    void adapters.profile.getProfile().then((envelope) => {
      if (cancelled) return;
      setProfile(envelope.profile ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [adapters.profile]);

  const analysis = useMemo(() => getProfileAnalysis(profile), [profile]);
  const confidence = useMemo(
    () =>
      getDecisionConfidence({
        answerProgress: { answered: analysis.filledFields.length, total: 8, requiredAnswered: Math.min(analysis.filledFields.length, 5), requiredTotal: 5 },
        profileAnalysis: analysis,
        decisionSignals: profile?.source === "cloud" ? 3 : 1,
        assumptions: [],
      }),
    [analysis, profile?.source],
  );

  const syncStatus = session?.user ? (profile?.source === "cloud" ? "Synced to Google account" : "Signed in, waiting to sync") : "Stored locally on this device";
  const legalStatus = "Google-only auth preserved. Anonymous usage stays available.";

  const boosters = analysis.nextBestField ? [analysis.nextBestField] : [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="max-w-3xl">
        <Badge>{session?.user ? "Personalization hub" : "Anonymous mode"}</Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-[-.035em] sm:text-4xl">Improve Accuracy</h1>
        <p className="mt-3 text-base leading-7 text-muted">Your profile helps DataStorified make future decisions more relevant. You control what you share.</p>
      </div>

      {!session?.user && (
        <Card className="mt-8 border-primary/15 bg-primary/[.04] p-5">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Google sign-in benefit</p>
          <h2 className="mt-2 text-xl font-bold">Sign in later to sync your local profile.</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            You can keep using the app anonymously. Google sign-in only helps save and sync your profile across devices.
          </p>
          <GoogleSignInButton className="mt-4">Sign in with Google</GoogleSignInButton>
        </Card>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Decision Confidence Score</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-3xl font-bold">{confidence.score}%</h2>
              <p className="mt-2 text-sm leading-6 text-muted">Current confidence is a rounded preview, not a promise or recommendation.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <Badge className="border-success/15 bg-success/10 text-success">{confidence.confidenceBand} confidence</Badge>
              <Badge className="border-border bg-soft text-muted">{syncStatus}</Badge>
            </div>
          </div>
          <div className="mt-5">
            <DecisionConfidenceCard confidence={confidence} />
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Profile Completion</p>
          <div className="mt-4">
            <ProfileCompletenessCard analysis={analysis} />
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_.9fr]">
        <ProgressiveProfileNudge
          context="money"
          profile={profile ?? undefined}
          title="Add one detail to improve money decision confidence."
          description="This stays optional and skippable."
          onSkip={() => window.location.assign("/decision")}
          onSaved={() => setProfile((current) => ({ ...(current ?? {}), updatedAt: new Date().toISOString() }))}
        />
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Accuracy boosters</p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">
            <li>• Add one field at a time.</li>
            <li>• Optional profile details improve previews and result context.</li>
            <li>• You can skip anything and continue using decisions anonymously.</li>
          </ul>
          {boosters[0] && (
            <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/[.04] p-4">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Next best booster</p>
              <p className="mt-1 font-semibold">{boosters[0].label}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{boosters[0].description}</p>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <PrivacyControlPanel
          profile={profile}
          analysis={analysis}
          syncStatus={syncStatus}
          legalStatus={legalStatus}
          onClearLocalProfile={async () => {
            const confirmed = window.confirm("Clear your local personalization data from this device?");
            if (!confirmed) return;
            saveLocalProfile({});
            const envelope = await adapters.profile.getProfile();
            setProfile(envelope.profile ?? null);
          }}
          onClearLocalDecisionHistory={() => {
            const confirmed = window.confirm("Clear your local decision history from this device?");
            if (!confirmed) return;
            localDecisionStorage.clearHistory();
          }}
          onExportMyData={() => {
            const payload = buildExportPayload(profile, analysis, syncStatus, legalStatus);
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = "datastorified-my-data.json";
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        />
        <SyncStatusCard syncStatus={syncStatus} canSync={Boolean(session?.user)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Data you’ve shared</p>
          <div className="mt-4 space-y-3">
            {PROFILE_FIELDS.map((field) => (
              <ProfileFieldRow
                key={field.key}
                field={field}
                profile={profile}
                editingField={editingField}
                draftValue={draftValue}
                onEdit={() => {
                  setEditingField(field.key);
                  setDraftValue(formatCurrentValue(profile?.[field.key]));
                }}
                onChangeDraft={setDraftValue}
                onSave={async () => {
                  const next = castFieldValue(field.key, draftValue);
                  saveLocalProfile({ [field.key]: next } as Partial<DecisionProfile>);
                  const envelope = await adapters.profile.getProfile();
                  setProfile(envelope.profile ?? null);
                  setEditingField(null);
                }}
                onRemove={async () => {
                  removeLocalProfileField(field.key);
                  const envelope = await adapters.profile.getProfile();
                  setProfile(envelope.profile ?? null);
                  setEditingField(null);
                }}
                onCancel={() => setEditingField(null)}
              />
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Missing signals</p>
            <div className="mt-3">
              <MissingSignalList signals={confidence.missingSignals} />
            </div>
            {confidence.impactPreview && (
              <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/[.04] p-4 text-sm leading-6 text-muted">
                Add {confidence.impactPreview.label} to improve confidence from {confidence.impactPreview.from}% to {confidence.impactPreview.to}%.
              </div>
            )}
          </Card>

          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Profile Completeness</p>
            <div className="mt-3">
              <ProfileCompletenessImpact analysis={analysis} />
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Saved decision sync status</p>
          <p className="mt-2 text-sm leading-6 text-muted">{syncStatus}</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            {session?.user ? "Signed-in users can sync saved decisions and profile updates later." : "Anonymous usage stays local first until you choose to sign in."}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Profile data management</p>
          <div className="mt-3 space-y-2 text-sm leading-6 text-muted">
            <p>• Each field can be edited or removed in the list above.</p>
            <p>• Changes stay local first unless you sign in for sync later.</p>
            <p>• Google login only helps sync and save benefits.</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={async () => { saveLocalProfile({}); const envelope = await adapters.profile.getProfile(); setProfile(envelope.profile ?? null); }}>Refresh local profile <RefreshCcw size={16} /></Button>
            <Button variant="ghost" onClick={async () => { removeLocalProfileField("city"); const envelope = await adapters.profile.getProfile(); setProfile(envelope.profile ?? null); }}>Remove city</Button>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Google account / sign-in state</p>
          <div className="mt-3 flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/[.08] text-primary">
              <Shield size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold">{session?.user ? "Signed in with Google" : "Not signed in"}</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                {session?.user ? "Your profile can sync across devices." : "Anonymous usage is fully supported and your profile stays local."}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Legal / terms status</p>
          <div className="mt-3 flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/[.08] text-primary">
              <CheckCircle2 size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold">Google-only auth preserved</p>
              <p className="mt-1 text-sm leading-6 text-muted">{legalStatus}</p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}

function ProfileFieldRow({
  field,
  profile,
  editingField,
  draftValue,
  onEdit,
  onChangeDraft,
  onSave,
  onRemove,
  onCancel,
}: {
  field: EditableField;
  profile: DecisionProfile | null;
  editingField: keyof DecisionProfile | null;
  draftValue: string;
  onEdit: () => void;
  onChangeDraft: (value: string) => void;
  onSave: () => void;
  onRemove: () => void;
  onCancel: () => void;
}) {
  const current = profile?.[field.key];
  const isEditing = editingField === field.key;
  return (
    <div className="rounded-3xl border border-border bg-soft/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">{field.label}</p>
          <p className="mt-1 text-sm leading-6 text-muted">{field.benefit}</p>
          <p className="mt-2 text-sm font-semibold text-ink">{currentValueLabel(current)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" className="min-h-10" onClick={onEdit}><PencilLine size={15} /> Edit</Button>
          <Button variant="ghost" className="min-h-10" onClick={onRemove}><Trash2 size={15} /> Remove</Button>
        </div>
      </div>
      {isEditing && (
        <div className="mt-4 space-y-3 rounded-2xl border border-border bg-white p-4">
          <ProfileFieldEditor field={field} value={draftValue} onChange={onChangeDraft} />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onSave}>Save</Button>
            <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileFieldEditor({ field, value, onChange }: { field: EditableField; value: string; onChange: (value: string) => void; }) {
  if (field.type === "number") {
    return <input value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15" inputMode="numeric" />;
  }
  if (field.type === "multiselect") {
    return <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Comma separated goals" className="min-h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15" />;
  }
  if (field.options?.length) {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {field.options.map((option) => (
          <button key={option} type="button" onClick={() => onChange(option)} className={`min-h-11 rounded-2xl border px-4 text-left text-sm font-semibold ${value === option ? "border-primary bg-primary/5 text-primary" : "border-border bg-white text-ink"}`}>
            {option}
          </button>
        ))}
      </div>
    );
  }
  return <input value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15" />;
}

function currentValueLabel(value: unknown) {
  if (value == null || value === "") return "Not added";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Not added";
  return String(value);
}

function formatCurrentValue(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  if (value == null) return "";
  return String(value);
}

function castFieldValue(field: keyof DecisionProfile, value: string) {
  if (field === "dependents" || field === "monthlyIncome" || field === "monthlyExpenses" || field === "emergencyFund" || field === "assets" || field === "liabilities" || field === "activeLoans" || field === "monthlyEmis") {
    return Number(value || 0);
  }
  if (field === "goals") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return value.trim();
}

function PrivacyControlPanel({
  profile,
  analysis,
  syncStatus,
  legalStatus,
  onClearLocalProfile,
  onClearLocalDecisionHistory,
  onExportMyData,
}: {
  profile: DecisionProfile | null;
  analysis: ReturnType<typeof getProfileAnalysis>;
  syncStatus: string;
  legalStatus: string;
  onClearLocalProfile: () => void;
  onClearLocalDecisionHistory: () => void;
  onExportMyData: () => void;
}) {
  return (
    <Card className="p-5">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Privacy controls</p>
      <h2 className="mt-2 text-xl font-bold">Control personalization data</h2>
      <p className="mt-2 text-sm leading-6 text-muted">You decide what stays on this device and what can sync after Google sign-in.</p>
      <div className="mt-4">
        <PersonalizationDataSummary profile={profile} analysis={analysis} syncStatus={syncStatus} legalStatus={legalStatus} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <ExportMyDataAction onExport={onExportMyData} />
        <RemoveProfileFieldAction label="Clear local profile" onRemove={onClearLocalProfile} />
        <ClearLocalDecisionHistoryAction onClear={onClearLocalDecisionHistory} />
      </div>
    </Card>
  );
}

function SyncStatusCard({ syncStatus, canSync }: { syncStatus: string; canSync: boolean }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Sync status</p>
      <h2 className="mt-2 text-xl font-bold">{canSync ? "Sync is available" : "Local-first mode"}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{syncStatus}</p>
      <div className="mt-4 rounded-2xl border border-border bg-soft/20 p-4 text-sm leading-6 text-muted">
        Google sign-in only helps save and sync benefits. Anonymous usage stays available.
      </div>
    </Card>
  );
}

function buildPersonalizationSummary(profile: DecisionProfile | null, analysis: ReturnType<typeof getProfileAnalysis>) {
  const fields = analysis.filledFields.slice(0, 4).map((field) => field.replace(/([A-Z])/g, " $1").toLowerCase());
  const safeFields = fields.length ? fields.join(", ") : "no profile fields yet";
  const syncLabel = profile?.source === "cloud" ? "synced profile" : "local profile";
  return `${syncLabel} using ${safeFields}.`;
}

function PersonalizationDataSummary({
  profile,
  analysis,
  syncStatus,
  legalStatus,
}: {
  profile: DecisionProfile | null;
  analysis: ReturnType<typeof getProfileAnalysis>;
  syncStatus: string;
  legalStatus: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-soft/20 p-4 text-sm leading-6 text-muted">
      <p className="font-semibold text-ink">Used for personalization</p>
      <p className="mt-1">Local data includes drafts, saved decisions, search history, and the profile fields you added.</p>
      <p className="mt-1">Google sign-in can sync profile and saved decisions later.</p>
      <p className="mt-1">Personalization uses only the fields listed below, not raw answers in the UI.</p>
      <p className="mt-1">{buildPersonalizationSummary(profile, analysis)}</p>
      <p className="mt-2">{syncStatus}</p>
      <p className="mt-1">{legalStatus}</p>
    </div>
  );
}

function RemoveProfileFieldAction({ label, onRemove }: { label: string; onRemove: () => void }) {
  return <Button variant="ghost" onClick={onRemove}>{label}</Button>;
}

function ClearLocalDecisionHistoryAction({ onClear }: { onClear: () => void }) {
  return <Button variant="ghost" onClick={onClear}>Clear local decision history</Button>;
}

function ExportMyDataAction({ onExport }: { onExport: () => void }) {
  return <Button variant="secondary" onClick={onExport}>Export my data</Button>;
}

function buildExportPayload(profile: DecisionProfile | null, analysis: ReturnType<typeof getProfileAnalysis>, syncStatus: string, legalStatus: string) {
  return {
    exportedAt: new Date().toISOString(),
    syncStatus,
    legalStatus,
    profile: profile
      ? {
          source: profile.source ?? "local",
          updatedAt: profile.updatedAt ?? null,
          fields: {
            ageRange: profile.ageRange ?? null,
            city: profile.city ?? null,
            incomeRange: profile.incomeRange ?? null,
            riskComfort: profile.riskComfort ?? null,
            dependents: profile.dependents ?? null,
            careerStage: profile.careerStage ?? null,
            goals: profile.goals ?? [],
            homeOwnership: profile.homeOwnership ?? null,
            investmentExperience: profile.investmentExperience ?? null,
          },
        }
      : null,
    profileAnalysis: {
      score: analysis.score,
      percentage: analysis.percentage,
      level: analysis.level,
      label: analysis.label,
      description: analysis.description,
      filledFields: analysis.filledFields,
      missingFields: analysis.missingFields,
    },
    note: "This export intentionally excludes raw answers and sensitive decision inputs.",
  };
}
