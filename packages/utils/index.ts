export const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");
export const formatINR = (value: number, digits = 0) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);
export const formatNumber = (value: number, digits = 0) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
