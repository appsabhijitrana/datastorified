export const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
export const round = (value: number, digits = 0) => Number(value.toFixed(digits));
export const ratio = (part: number, total: number) => total > 0 ? part / total : 0;
