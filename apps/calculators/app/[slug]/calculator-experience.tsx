"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Heart, RotateCcw, Share2, Sigma } from "lucide-react";
import {
  calculate,
  calculatorBySlug,
  validateCalculatorInputs,
  type CalculatorDefinition,
  type CalculatorField,
} from "@datastorified/calculators-engine";
import { storage } from "@datastorified/storage";
import { trackCalculatorUsed, trackFavorite } from "@datastorified/analytics";
import {
  Badge,
  BottomNav,
  Breadcrumb,
  Button,
  CalculatorCard,
  Card,
  ChartCard,
  CopyButton,
  FAQ,
  Footer,
  Header,
  InsightCard,
  ResultCard,
} from "@datastorified/ui";
import { SmartNumberInput } from "@datastorified/ui/smart-number-input";
import type { SmartNumberMode } from "@datastorified/ui/smart-number";

export default function CalculatorExperience({ calculator }: { calculator: CalculatorDefinition }) {
  const defaults = useMemo(() => Object.fromEntries(calculator.fields.map((field) => [field.key, field.default])), [calculator]);
  const [values, setValues] = useState<Record<string, number>>(defaults);
  const [favorite, setFavorite] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = storage.getDraft<Record<string, number>>(calculator.slug, {});
    setValues({ ...defaults, ...saved });
    storage.addRecent("calculators", calculator.slug);
    setFavorite(storage.getFavorites("calculators").includes(calculator.slug));
    trackCalculatorUsed(calculator.slug);
    setReady(true);
  }, [calculator.slug, defaults]);

  useEffect(() => {
    if (ready) storage.saveDraft(calculator.slug, values);
  }, [calculator.slug, ready, values]);

  const result = useMemo(() => calculate(calculator.slug, values), [calculator.slug, values]);
  const errors = useMemo(() => [...validateCalculatorInputs(calculator, values), ...(result.error ? [result.error] : [])], [calculator, result.error, values]);
  const isValid = errors.length === 0;

  const updateValue = (field: CalculatorField, nextValue: number) => {
    setValues((current) => ({ ...current, [field.key]: nextValue }));
  };

  const toggleFavorite = () => {
    const active = storage.toggleFavorite("calculators", calculator.slug);
    setFavorite(active);
    trackFavorite(calculator.slug, "calculator", active);
  };

  const share = async () => {
    const shareData = { title: calculator.name, text: calculator.description, url: location.href };
    if (navigator.share) await navigator.share(shareData).catch(() => undefined);
    else await navigator.clipboard.writeText(location.href);
  };

  const resultLabel = result.primaryResult.label;
  const copyValue = `${resultLabel}: ${result.primaryResult.value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}${result.primaryResult.suffix ? ` ${result.primaryResult.suffix}` : ""}`;
  const faq = [
    { question: `How does the ${calculator.name} work?`, answer: calculator.formula },
    { question: "Is my information uploaded?", answer: "No. Phase 1 calculations run in your browser, and drafts are stored locally on this device." },
    { question: "Can I use this result for financial or health decisions?", answer: "Use it as a planning estimate. For tax, credit, health, or investment decisions, verify assumptions with a qualified professional." },
  ];

  return <>
    <Header surface="calculators" />
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-7 sm:px-6">
      <Breadcrumb items={[{ label: "Calculators", href: "/" }, { label: calculator.category, href: "/#categories" }, { label: calculator.name }]} />

      <div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{calculator.category}</Badge>
            {calculator.slug === "currency-converter" && <Badge className="border-warning/20 bg-warning/10 text-warning">Manual-rate demo</Badge>}
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">{calculator.name}</h1>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-muted">{calculator.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={toggleFavorite}><Heart size={17} className={favorite ? "fill-danger text-danger" : ""} />{favorite ? "Saved" : "Favorite"}</Button>
          <Button variant="ghost" aria-label="Share calculator" onClick={share}><Share2 size={17} /></Button>
        </div>
      </div>

      <div className="mt-10 grid items-start gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <Card className="min-w-0 overflow-hidden p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Live calculation</p>
              <h2 className="mt-1 text-xl font-bold">Your inputs</h2>
            </div>
            <button onClick={() => setValues(defaults)} className="flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-muted transition hover:bg-soft hover:text-primary"><RotateCcw size={14} /> Reset</button>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {calculator.fields.map((field) => <CalculatorInput key={field.key} field={field} value={values[field.key] ?? field.default} onChange={(value) => updateValue(field, value)} />)}
          </div>

          <div className="mt-6 flex gap-2 rounded-xl bg-soft p-3 text-xs leading-5 text-muted">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" />
            <span>Inputs save automatically on this device. Nothing is uploaded.</span>
          </div>
        </Card>

        <div className="space-y-5" aria-live="polite">
          {isValid ? <>
            <ResultCard label={resultLabel} value={result.primaryResult.value} unit={result.primaryResult.unit} suffix={result.primaryResult.suffix} secondary={result.secondaryResults} />
            <div className="flex justify-end"><CopyButton value={copyValue} /></div>
            <InsightCard>{result.insight}</InsightCard>
            {result.chartData.some((item) => item.value > 0) && <ChartCard data={result.chartData} />}
          </> : <Card className="border-warning/30 bg-warning/[.06] p-6">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 shrink-0 text-warning" />
              <div><h2 className="font-bold">Check your inputs</h2><ul className="mt-2 space-y-1 text-sm leading-6 text-muted">{[...new Set(errors)].map((error) => <li key={error}>{error}</li>)}</ul></div>
            </div>
          </Card>}

          <Card className="p-5">
            <div className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-soft text-primary"><Sigma size={18} /></span>
              <div><p className="font-semibold">How this is calculated</p><p className="mt-1 text-sm leading-6 text-muted">{calculator.formula}</p>{calculator.source && <a className="mt-2 inline-block text-sm font-semibold text-primary hover:underline" href={calculator.source.url} target="_blank" rel="noreferrer">{calculator.source.label} ↗</a>}</div>
            </div>
          </Card>

          <Card className="p-5">
            <p className="font-semibold">Assumptions and limitations</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
              {[...calculator.assumptions, ...result.warnings].map((item) => <li key={item} className="flex gap-2"><span className="text-primary">•</span><span>{item}</span></li>)}
            </ul>
          </Card>
        </div>
      </div>

      <section className="mt-16">
        <h2 className="text-2xl font-bold sm:text-3xl">Related calculators</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {calculator.related.map((slug) => calculatorBySlug(slug)).filter(Boolean).map((related) => <CalculatorCard key={related!.slug} name={related!.name} description={related!.description} category={related!.category} href={`/${related!.slug}`} />)}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold sm:text-3xl">Frequently asked questions</h2>
        <div className="mt-5"><FAQ items={faq} /></div>
      </section>

      <section className="mt-16 rounded-3xl bg-soft p-6 sm:p-10">
        <h2 className="text-2xl font-bold">Plan with context, not just a number</h2>
        <p className="mt-3 max-w-3xl leading-7 text-muted">This {calculator.name.toLowerCase()} is designed for fast scenario planning. Try a conservative case, a likely case, and an optimistic case. The range between them is often more useful than a single precise-looking answer.</p>
      </section>
    </main>
    <Footer />
    <BottomNav />
  </>;
}

function CalculatorInput({ field, value, onChange }: { field: CalculatorField; value: number; onChange: (value: number) => void }) {
  const inputId = `field-${field.key}`;
  const helpId = `${inputId}-help`;
  const selectValue = field.options?.some((option) => option.value === value) ? value : field.default;
  if (field.input !== "select") {
    const mode = numberModeFor(field);
    const isCurrency = mode === "currency";
    const isTemporal = ["years", "months", "days"].includes(mode);
    return <SmartNumberInput
      id={inputId}
      label={field.label}
      description={field.help}
      value={Number.isFinite(value) ? value : null}
      onChange={(result) => onChange(result.numericValue ?? Number.NaN)}
      mode={mode}
      format="indian"
      currency="INR"
      unit={!isCurrency && mode !== "percentage" ? field.suffix : undefined}
      min={field.min}
      max={field.max}
      step={field.step}
      allowNegative={(field.min ?? 0) < 0}
      allowDecimal={(field.step ?? 1) % 1 !== 0}
      showWords={isCurrency}
      showChips={isCurrency && field.default >= 5_000}
      showSlider={mode === "percentage" && field.min !== undefined && field.max !== undefined}
      showStepper={mode === "percentage" || isTemporal}
      actions={["clear", "reset"]}
      defaultValue={field.default}
      compact
    />;
  }
  return <label htmlFor={inputId} className="block rounded-[24px] border border-border bg-white p-5 shadow-sm">
    <span className="mb-2 block text-sm font-semibold">{field.label}</span>
    <select
      id={inputId}
      value={selectValue}
      onChange={(event) => onChange(Number(event.target.value))}
      aria-describedby={field.help ? helpId : undefined}
      className="min-h-12 w-full rounded-xl border border-border bg-white px-4 text-base text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
    >
      {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    {field.help && <span id={helpId} className="mt-1.5 block text-xs leading-5 text-muted">{field.help}</span>}
  </label>;
}

function numberModeFor(field: CalculatorField): SmartNumberMode {
  const suffix = field.suffix?.toLocaleLowerCase() ?? "";
  if (suffix.includes("₹")) return "currency";
  if (suffix === "%") return "percentage";
  if (suffix.includes("year")) return "years";
  if (suffix.includes("month")) return "months";
  if (suffix.includes("day")) return "days";
  if (suffix === "kg") return "weight";
  if (suffix.startsWith("km")) return "distance";
  if (suffix === "l") return "volume";
  return (field.step ?? 1) % 1 === 0 ? "integer" : "decimal";
}
