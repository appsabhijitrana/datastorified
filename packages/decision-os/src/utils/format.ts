import type { DecisionValue } from "../types";

export function formatDecisionValue(value: DecisionValue | undefined): string {
  if (value === undefined || value === null) return "Not provided";
  if (Array.isArray(value)) return value.map((item) => formatDecisionValue(item)).join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return new Intl.NumberFormat("en").format(value);
  return value;
}

export function normalizeText(value: string): string {
  return value.toLocaleLowerCase().replace(/[^a-z0-9\s]/gu, " ").replace(/\s+/gu, " ").trim();
}
