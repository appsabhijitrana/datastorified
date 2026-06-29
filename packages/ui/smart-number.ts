import { useCallback } from "react";

export type NumberFormatMode = "indian" | "international" | "normal" | "scientific";
export type SmartNumberMode = "currency" | "percentage" | "integer" | "decimal" | "distance" | "weight" | "temperature" | "years" | "months" | "days" | "area" | "volume" | "data-size" | "custom";

export type ParsedSmartNumber = {
  rawInput: string;
  numericValue: number | null;
  multiplier: number;
  normalizedInput: string;
  isParseable: boolean;
};

const multipliers: Record<string, number> = {
  k: 1_000, thousand: 1_000,
  l: 100_000, lac: 100_000, lakh: 100_000, lakhs: 100_000,
  cr: 10_000_000, crore: 10_000_000, crores: 10_000_000,
  m: 1_000_000, mn: 1_000_000, million: 1_000_000, millions: 1_000_000,
  b: 1_000_000_000, bn: 1_000_000_000, billion: 1_000_000_000, billions: 1_000_000_000,
};

const normalizeNumericInput = (input: string) => input
  .trim()
  .toLocaleLowerCase("en-IN")
  .replace(/[₹$€£¥,%]/gu, "")
  .replace(/,/gu, "")
  .replace(/\s+/gu, " ");

export function parseSmartNumber(input: string, allowScientific = false): ParsedSmartNumber {
  const normalizedInput = normalizeNumericInput(input);
  if (!normalizedInput) return { rawInput: input, numericValue: null, multiplier: 1, normalizedInput, isParseable: false };
  const pattern = allowScientific
    ? /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*([a-z]+)?$/iu
    : /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*([a-z]+)?$/iu;
  const match = normalizedInput.match(pattern);
  if (!match) return { rawInput: input, numericValue: null, multiplier: 1, normalizedInput, isParseable: false };
  const base = Number(match[1]);
  const suffix = match[2]?.toLocaleLowerCase("en-IN") ?? "";
  const multiplier = suffix ? multipliers[suffix] : 1;
  if (!Number.isFinite(base) || (suffix && !multipliers[suffix])) return { rawInput: input, numericValue: null, multiplier: 1, normalizedInput, isParseable: false };
  const numericValue = base * multiplier;
  return { rawInput: input, numericValue: Number.isFinite(numericValue) ? numericValue : null, multiplier, normalizedInput, isParseable: Number.isFinite(numericValue) };
}

export const parseIndianNumber = (input: string) => parseSmartNumber(input).numericValue;
export const parseInternationalNumber = (input: string) => parseSmartNumber(input).numericValue;

type FormatOptions = { currency?: string; locale?: string; maximumFractionDigits?: number; minimumFractionDigits?: number; compact?: boolean };

export function formatIndianNumber(value: number, options: FormatOptions = {}): string {
  if (!Number.isFinite(value)) return "";
  const { currency, locale = "en-IN", maximumFractionDigits = 2, minimumFractionDigits = 0 } = options;
  return new Intl.NumberFormat(locale, {
    style: currency ? "currency" : "decimal",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(value);
}

export function formatInternationalNumber(value: number, options: FormatOptions = {}): string {
  if (!Number.isFinite(value)) return "";
  const { currency, locale = "en-US", maximumFractionDigits = 2, minimumFractionDigits = 0, compact = false } = options;
  return new Intl.NumberFormat(locale, {
    style: currency ? "currency" : "decimal",
    currency,
    currencyDisplay: "narrowSymbol",
    notation: compact ? "compact" : "standard",
    compactDisplay: "short",
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(value);
}

const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const belowThousand = (value: number): string => {
  const integer = Math.floor(value);
  if (integer < 20) return ones[integer];
  if (integer < 100) return [tens[Math.floor(integer / 10)], ones[integer % 10]].filter(Boolean).join(" ");
  return [ones[Math.floor(integer / 100)], "Hundred", belowThousand(integer % 100)].filter(Boolean).join(" ");
};
const decimalWords = (value: number) => {
  const rendered = value.toFixed(6).replace(/0+$/u, "").split(".")[1];
  return rendered ? ` Point ${[...rendered].map((digit) => ones[Number(digit)] || "Zero").join(" ")}` : "";
};

export function numberToIndianWords(value: number): string {
  if (!Number.isFinite(value)) return "";
  if (value === 0) return "Zero";
  const negative = value < 0 ? "Minus " : "";
  const absolute = Math.abs(value); let integer = Math.floor(absolute); const parts: string[] = [];
  const crore = Math.floor(integer / 10_000_000); if (crore) { parts.push(numberToIndianWords(crore), "Crore"); integer %= 10_000_000; }
  const lakh = Math.floor(integer / 100_000); if (lakh) { parts.push(belowThousand(lakh), "Lakh"); integer %= 100_000; }
  const thousand = Math.floor(integer / 1_000); if (thousand) { parts.push(belowThousand(thousand), "Thousand"); integer %= 1_000; }
  if (integer) parts.push(belowThousand(integer));
  return `${negative}${parts.join(" ")}${decimalWords(absolute)}`.trim();
}

export function numberToInternationalWords(value: number): string {
  if (!Number.isFinite(value)) return "";
  if (value === 0) return "Zero";
  const negative = value < 0 ? "Minus " : "";
  const absolute = Math.abs(value); let integer = Math.floor(absolute); const parts: string[] = [];
  for (const [size, label] of [[1_000_000_000, "Billion"], [1_000_000, "Million"], [1_000, "Thousand"]] as const) {
    const group = Math.floor(integer / size); if (group) { parts.push(numberToInternationalWords(group), label); integer %= size; }
  }
  if (integer) parts.push(belowThousand(integer));
  return `${negative}${parts.join(" ")}${decimalWords(absolute)}`.trim();
}

export function formatSmartNumber(value: number, mode: SmartNumberMode, format: NumberFormatMode, options: FormatOptions & { unit?: string } = {}): string {
  if (!Number.isFinite(value)) return "";
  if (format === "scientific") return value.toExponential(Math.min(8, options.maximumFractionDigits ?? 4));
  const currency = mode === "currency" ? options.currency ?? "INR" : undefined;
  const formatted = format === "indian"
    ? formatIndianNumber(value, { ...options, currency })
    : format === "international"
      ? formatInternationalNumber(value, { ...options, currency })
      : String(value);
  const suffixes: Partial<Record<SmartNumberMode, string>> = { percentage: "%", distance: options.unit ?? "km", weight: options.unit ?? "kg", temperature: options.unit ?? "°C", years: "years", months: "months", days: "days", area: options.unit ?? "sq ft", volume: options.unit ?? "L", "data-size": options.unit ?? "MB", custom: options.unit ?? "" };
  const suffix = suffixes[mode];
  return suffix ? `${formatted}${mode === "percentage" || mode === "temperature" ? "" : " "}${suffix}` : formatted;
}

export const useSmartNumberParser = (allowScientific = false) => useCallback((input: string) => parseSmartNumber(input, allowScientific), [allowScientific]);
export const useIndianFormatter = (options: FormatOptions = {}) => {
  const { currency, locale, maximumFractionDigits, minimumFractionDigits } = options;
  return useCallback((value: number) => formatIndianNumber(value, { currency, locale, maximumFractionDigits, minimumFractionDigits }), [currency, locale, maximumFractionDigits, minimumFractionDigits]);
};
export const useNumberToWords = (format: "indian" | "international" = "indian") => useCallback((value: number) => format === "indian" ? numberToIndianWords(value) : numberToInternationalWords(value), [format]);
export const useInputFormatter = (mode: SmartNumberMode, format: NumberFormatMode, options: FormatOptions & { unit?: string } = {}) => {
  const { currency, locale, maximumFractionDigits, minimumFractionDigits, unit } = options;
  return useCallback((value: number) => formatSmartNumber(value, mode, format, { currency, locale, maximumFractionDigits, minimumFractionDigits, unit }), [currency, format, locale, maximumFractionDigits, minimumFractionDigits, mode, unit]);
};
