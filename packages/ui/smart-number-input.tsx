"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Check, CircleDollarSign, Clipboard, Copy, Database, Gauge, Minus, Percent, Plus, RotateCcw, Ruler, Scale, Thermometer, Trash2 } from "lucide-react";
import { z } from "zod";
import { cn } from "@datastorified/utils";
import { formatSmartNumber, numberToIndianWords, numberToInternationalWords, parseSmartNumber, type NumberFormatMode, type SmartNumberMode } from "./smart-number";

export type SmartNumberChange = {
  rawInput: string;
  numericValue: number | null;
  formattedValue: string;
  words: string;
  isValid: boolean;
  validationErrors: string[];
};

export type SmartNumberChip = { label: string; value: number; action?: "set" | "add" };
export type SmartNumberAction = "clear" | "copy" | "paste" | "reset" | "calculator";

export type SmartNumberInputProps = {
  label: string;
  description?: string;
  value: number | null;
  onChange: (result: SmartNumberChange) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  currency?: string;
  locale?: string;
  mode?: SmartNumberMode;
  format?: NumberFormatMode;
  showWords?: boolean;
  showSlider?: boolean;
  showStepper?: boolean;
  showChips?: boolean;
  chips?: SmartNumberChip[];
  actions?: SmartNumberAction[];
  helperText?: string;
  min?: number;
  max?: number;
  step?: number;
  allowNegative?: boolean;
  allowDecimal?: boolean;
  allowScientific?: boolean;
  required?: boolean;
  icon?: React.ReactNode;
  placeholder?: string;
  unit?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  defaultValue?: number | null;
  maximumFractionDigits?: number;
  className?: string;
  compact?: boolean;
  defaultView?: "simple" | "smart";
  showSmartToggle?: boolean;
  onCalculator?: () => void;
};

const defaultIcon = (mode: SmartNumberMode) => {
  const icons: Partial<Record<SmartNumberMode, React.ReactNode>> = {
    currency: <CircleDollarSign size={19} />, percentage: <Percent size={19} />, distance: <Ruler size={19} />,
    weight: <Scale size={19} />, temperature: <Thermometer size={19} />, years: <CalendarDays size={19} />,
    months: <CalendarDays size={19} />, days: <CalendarDays size={19} />, area: <Ruler size={19} />,
    volume: <Gauge size={19} />, "data-size": <Database size={19} />,
  };
  return icons[mode] ?? <Gauge size={19} />;
};

const actionIcon: Record<SmartNumberAction, React.ReactNode> = {
  clear: <Trash2 size={15} />, copy: <Copy size={15} />, paste: <Clipboard size={15} />, reset: <RotateCcw size={15} />, calculator: <Gauge size={15} />,
};

const defaultChips = (mode: SmartNumberMode): SmartNumberChip[] => mode === "currency"
  ? [{ label: "+₹5K", value: 5_000, action: "add" }, { label: "+₹25K", value: 25_000, action: "add" }, { label: "+₹1L", value: 100_000, action: "add" }]
  : mode === "percentage"
    ? [{ label: "5%", value: 5 }, { label: "10%", value: 10 }, { label: "15%", value: 15 }]
    : [];

const countNumericCharacters = (value: string) => (value.match(/[\d.-]/gu) ?? []).length;
const caretAfterNumericCount = (value: string, count: number) => {
  if (count <= 0) return value.search(/[\d-]/u) >= 0 ? value.search(/[\d-]/u) : 0;
  let seen = 0;
  for (let index = 0; index < value.length; index += 1) if (/[\d.-]/u.test(value[index]) && ++seen >= count) return index + 1;
  return value.length;
};

function SmartNumberInputComponent({
  label, description, value, onChange, onBlur, currency = "INR", locale = "en-IN", mode = "decimal", format = "indian",
  showWords = false, showSlider = false, showStepper = false, showChips = false, chips, actions = ["clear"], helperText,
  min, max, step = 1, allowNegative = false, allowDecimal = true, allowScientific = false, required = true, icon,
  placeholder = "Enter a value", unit, name, id, disabled = false, defaultValue, maximumFractionDigits = 2, className, compact = false, defaultView = "simple", showSmartToggle = true, onCalculator,
}: SmartNumberInputProps, forwardedRef: React.ForwardedRef<HTMLInputElement>) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const helpId = `${inputId}-help`; const errorId = `${inputId}-error`; const wordsId = `${inputId}-words`;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const pendingCaret = React.useRef<number | null>(null);
  const initialValue = React.useRef(defaultValue ?? value);
  const timers = React.useRef<{ delay?: ReturnType<typeof setTimeout>; repeat?: ReturnType<typeof setInterval> }>({});
  const [focused, setFocused] = React.useState(false); const [touched, setTouched] = React.useState(false); const [shake, setShake] = React.useState(0);
  const [smartOpen, setSmartOpen] = React.useState(defaultView === "smart");

  const formatValue = React.useCallback((numeric: number) => formatSmartNumber(numeric, mode, format, { currency, locale, unit, maximumFractionDigits }), [currency, format, locale, maximumFractionDigits, mode, unit]);
  const wordsFor = React.useCallback((numeric: number) => format === "international" ? numberToInternationalWords(numeric) : numberToIndianWords(numeric), [format]);
  const [display, setDisplay] = React.useState(() => value === null || !Number.isFinite(value) ? "" : formatValue(value));

  const cleanForParsing = React.useCallback((raw: string) => unit ? raw.replace(new RegExp(`${unit.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}$`, "iu"), "") : raw, [unit]);
  const validate = React.useCallback((numeric: number | null, raw: string) => {
    if (numeric === null) return !raw.trim() && !required ? [] : [raw.trim() ? `Try a number such as ${formatValue(Math.max(min ?? 25_000, 1))} or “25 lakh”.` : `${label} is required.`];
    let schema = z.number().finite();
    if (!allowNegative) schema = schema.min(0);
    if (min !== undefined) schema = schema.min(min);
    if (max !== undefined) schema = schema.max(max);
    const parsed = schema.safeParse(numeric);
    if (!parsed.success) {
      if (min !== undefined && max !== undefined) return [`${label} should be between ${formatValue(min)} and ${formatValue(max)}.`];
      if (min !== undefined && numeric < min) return [`${label} should be at least ${formatValue(min)}.`];
      if (max !== undefined && numeric > max) return [`${label} should be no more than ${formatValue(max)}.`];
      if (!allowNegative && numeric < 0) return [`${label} cannot be negative.`];
      return [`Check the value entered for ${label.toLocaleLowerCase()}.`];
    }
    if (!allowDecimal && !Number.isInteger(numeric)) return [`${label} should be a whole number.`];
    return [];
  }, [allowDecimal, allowNegative, formatValue, label, max, min, required]);

  const parsedDisplay = React.useMemo(() => parseSmartNumber(cleanForParsing(display), allowScientific), [allowScientific, cleanForParsing, display]);
  const errors = React.useMemo(() => validate(parsedDisplay.numericValue, display), [display, parsedDisplay.numericValue, validate]);
  const valid = errors.length === 0; const words = parsedDisplay.numericValue === null ? "" : wordsFor(parsedDisplay.numericValue);

  React.useEffect(() => {
    if (!focused) setDisplay(value === null || !Number.isFinite(value) ? "" : formatValue(value));
  }, [focused, formatValue, value]);
  React.useEffect(() => () => { if (timers.current.delay) clearTimeout(timers.current.delay); if (timers.current.repeat) clearInterval(timers.current.repeat); }, []);
  React.useLayoutEffect(() => {
    if (pendingCaret.current !== null && inputRef.current) { inputRef.current.setSelectionRange(pendingCaret.current, pendingCaret.current); pendingCaret.current = null; }
  }, [display]);

  const assignRef = React.useCallback((node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node); else if (forwardedRef) forwardedRef.current = node;
  }, [forwardedRef]);

  const emit = React.useCallback((rawInput: string, numericValue: number | null, nextErrors?: string[]) => {
    const validationErrors = nextErrors ?? validate(numericValue, rawInput);
    onChange({ rawInput, numericValue, formattedValue: numericValue === null ? "" : formatValue(numericValue), words: numericValue === null ? "" : wordsFor(numericValue), isValid: validationErrors.length === 0, validationErrors });
  }, [formatValue, onChange, validate, wordsFor]);

  const setNumericValue = React.useCallback((numeric: number | null, raw = numeric === null ? "" : String(numeric)) => {
    const bounded = numeric === null ? null : Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min ?? Number.NEGATIVE_INFINITY, numeric));
    const next = bounded === null ? "" : formatValue(bounded); setDisplay(next); emit(raw, bounded); setTouched(true);
  }, [emit, formatValue, max, min]);

  const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value; const caret = event.target.selectionStart ?? raw.length; const numericCount = countNumericCharacters(raw.slice(0, caret));
    const parsed = parseSmartNumber(cleanForParsing(raw), allowScientific); const nextErrors = validate(parsed.numericValue, raw);
    const preserveLiteral = /\s$/u.test(raw) || /[a-z]$/iu.test(raw) && !parsed.isParseable;
    const nextDisplay = parsed.isParseable && !preserveLiteral ? formatValue(parsed.numericValue!) : raw;
    if (parsed.isParseable && nextDisplay !== raw) pendingCaret.current = caret === raw.length ? nextDisplay.length : caretAfterNumericCount(nextDisplay, numericCount);
    setDisplay(nextDisplay); emit(raw, parsed.numericValue, nextErrors); setTouched(true);
    if (nextErrors.length) setShake((current) => current + 1);
  };

  const commit = () => {
    const parsed = parseSmartNumber(cleanForParsing(display), allowScientific);
    if (parsed.numericValue !== null) setDisplay(formatValue(parsed.numericValue));
  };
  const adjust = React.useCallback((direction: number) => setNumericValue((parsedDisplay.numericValue ?? value ?? 0) + direction * step), [parsedDisplay.numericValue, setNumericValue, step, value]);
  const stopStepping = () => { if (timers.current.delay) clearTimeout(timers.current.delay); if (timers.current.repeat) clearInterval(timers.current.repeat); timers.current = {}; };
  const startStepping = (direction: number) => { adjust(direction); timers.current.delay = setTimeout(() => { timers.current.repeat = setInterval(() => adjust(direction), 80); }, 350); };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowUp") { event.preventDefault(); adjust(1); }
    if (event.key === "ArrowDown") { event.preventDefault(); adjust(-1); }
    if (event.key === "Enter") { event.preventDefault(); commit(); }
    if (event.key === "Escape") { event.preventDefault(); setDisplay(value === null ? "" : formatValue(value)); inputRef.current?.blur(); }
  };

  const handleAction = async (action: SmartNumberAction) => {
    if (action === "clear") setNumericValue(null);
    if (action === "copy" && parsedDisplay.numericValue !== null) await navigator.clipboard.writeText(formatValue(parsedDisplay.numericValue));
    if (action === "paste") { const pasted = await navigator.clipboard.readText(); const parsed = parseSmartNumber(cleanForParsing(pasted), allowScientific); setDisplay(pasted); emit(pasted, parsed.numericValue); }
    if (action === "reset") setNumericValue(initialValue.current ?? null);
    if (action === "calculator") onCalculator?.();
  };

  const suggestion = /monthly\s+(salary|income)/iu.test(label) && parsedDisplay.numericValue !== null && parsedDisplay.numericValue >= 1_000_000 ? "This looks high for a monthly value. Did you mean annual salary?" : "";
  const activeChips = chips ?? defaultChips(mode);
  const advancedVisible = smartOpen || showStepper || showSlider || showChips || activeChips.length > 0 || actions.length > 0 || Boolean(onCalculator);

  return <motion.div
    key={shake}
    animate={errors.length && touched ? { x: [0, -3, 3, -2, 2, 0] } : { x: 0 }}
    transition={{ duration: .24 }}
    className={cn("w-full min-w-0 max-w-full overflow-hidden rounded-[24px] p-px transition-shadow", focused ? "bg-gradient-to-br from-primary to-accent shadow-glow" : errors.length && touched ? "bg-danger/60" : "bg-border/80", className)}
  >
    <div className={cn("min-w-0 rounded-[23px] bg-white", compact ? "p-4" : "p-5 sm:p-6")}>
      <div className="flex items-start justify-between gap-3">
        <div><label htmlFor={inputId} className="text-sm font-bold tracking-tight text-ink">{label}</label>{description && <p className="mt-1 text-xs leading-5 text-muted">{description}</p>}</div>
        <AnimatePresence mode="wait">{touched && valid && display && <motion.span initial={{ scale: .7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: .7, opacity: 0 }} className="grid size-7 place-items-center rounded-full bg-success/10 text-success" aria-label="Valid value"><Check size={15} /></motion.span>}</AnimatePresence>
      </div>

      <div className="mt-4 flex items-start gap-2">
        <span className={cn("grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 text-primary", compact ? "size-9" : "size-11")}>{icon ?? defaultIcon(mode)}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <input
              ref={assignRef} id={inputId} name={name} type="text" inputMode="decimal" autoComplete="off" spellCheck={false}
              value={display} disabled={disabled} placeholder={placeholder} aria-label={label} aria-invalid={touched && !valid}
              aria-describedby={[helperText || description ? helpId : "", touched && !valid ? errorId : "", showWords && words ? wordsId : ""].filter(Boolean).join(" ") || undefined}
              onChange={handleInput} onKeyDown={handleKeyDown} onFocus={() => setFocused(true)}
              onBlur={(event) => { setFocused(false); setTouched(true); commit(); onBlur?.(event); }}
              className={cn("min-w-0 flex-1 bg-transparent font-bold tracking-[-.025em] text-ink outline-none placeholder:font-medium placeholder:tracking-normal placeholder:text-muted/60 disabled:cursor-not-allowed disabled:opacity-50", compact ? "text-xl" : "text-2xl sm:text-3xl")}
            />
            {showSmartToggle && advancedVisible && <button type="button" onClick={() => setSmartOpen((current) => !current)} className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-primary/30 hover:text-primary">{smartOpen ? "Simple" : "Smart"}</button>}
          </div>
          {smartOpen && <div className="mt-3 rounded-2xl border border-border bg-soft/60 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-primary"><Database size={14} /> Platform DNA</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl bg-white p-3"><p className="text-[11px] font-semibold uppercase tracking-[.12em] text-muted">Simple</p><p className="mt-1 text-sm font-semibold text-ink">Primary input first</p></div>
              <div className="rounded-xl bg-white p-3"><p className="text-[11px] font-semibold uppercase tracking-[.12em] text-muted">Smart</p><p className="mt-1 text-sm font-semibold text-ink">Reveal advanced controls</p></div>
              <div className="rounded-xl bg-white p-3"><p className="text-[11px] font-semibold uppercase tracking-[.12em] text-muted">Mobile</p><p className="mt-1 text-sm font-semibold text-ink">Less clutter, more room</p></div>
            </div>
          </div>}
        </div>
      </div>

      {showWords && words && <motion.p id={wordsId} key={words} initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }} aria-live="polite" className="mt-3 text-sm font-medium text-primary">{words}</motion.p>}
      {(helperText || description) && <p id={helpId} className="mt-2 text-xs leading-5 text-muted">{helperText ?? description}</p>}
      {suggestion && valid && <p className="mt-2 rounded-xl bg-warning/10 px-3 py-2 text-xs font-medium text-warning">{suggestion}</p>}
      <AnimatePresence>{touched && errors.length > 0 && <motion.p id={errorId} role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 text-xs font-semibold leading-5 text-danger">{errors[0]}</motion.p>}</AnimatePresence>

      {advancedVisible && <div className="mt-4">
        {!smartOpen && showSmartToggle && <button type="button" onClick={() => setSmartOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-white px-4 text-xs font-semibold text-muted transition hover:border-primary/30 hover:text-primary">Show smart controls</button>}
        {smartOpen && <>
          {showStepper && <div className="mt-4 flex items-center gap-2"><button type="button" aria-label={`Decrease ${label}`} disabled={disabled} onPointerDown={() => startStepping(-1)} onPointerUp={stopStepping} onPointerLeave={stopStepping} className="grid size-10 shrink-0 place-items-center rounded-xl border border-border text-muted transition hover:border-primary/30 hover:text-primary disabled:opacity-40"><Minus size={17} /></button><div className="rounded-xl bg-soft px-3 py-2 text-xs font-semibold text-muted">Quick step control</div><button type="button" aria-label={`Increase ${label}`} disabled={disabled} onPointerDown={() => startStepping(1)} onPointerUp={stopStepping} onPointerLeave={stopStepping} className="grid size-10 shrink-0 place-items-center rounded-xl border border-border text-muted transition hover:border-primary/30 hover:text-primary disabled:opacity-40"><Plus size={17} /></button></div>}
          {showSlider && min !== undefined && max !== undefined && <div className="mt-5"><input aria-label={`${label} slider`} type="range" min={min} max={max} step={step} value={Math.min(max, Math.max(min, parsedDisplay.numericValue ?? min))} onChange={(event) => setNumericValue(Number(event.target.value))} className="h-2 w-full cursor-pointer accent-primary" /><div className="mt-1 flex justify-between text-[11px] font-medium text-muted"><span>{formatValue(min)}</span><span>{formatValue(max)}</span></div></div>}
          {showChips && activeChips.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{activeChips.map((chip) => <button type="button" key={chip.label} onClick={() => setNumericValue(chip.action === "add" ? (parsedDisplay.numericValue ?? 0) + chip.value : chip.value)} className="min-h-9 rounded-full border border-primary/10 bg-primary/[.045] px-3 text-xs font-bold text-primary transition hover:-translate-y-px hover:bg-primary/10">{chip.label}</button>)}</div>}
          {actions.length > 0 && <div className="mt-4 flex flex-wrap gap-1 border-t border-border/70 pt-3">{actions.map((action) => <button type="button" key={action} disabled={disabled || action === "copy" && parsedDisplay.numericValue === null} onClick={() => void handleAction(action)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold capitalize text-muted transition hover:bg-soft hover:text-primary disabled:opacity-40">{actionIcon[action]}{action}</button>)}</div>}
        </>}
      </div>}
    </div>
  </motion.div>;
}

export const SmartNumberInput = React.memo(React.forwardRef<HTMLInputElement, SmartNumberInputProps>(SmartNumberInputComponent));
SmartNumberInput.displayName = "SmartNumberInput";
