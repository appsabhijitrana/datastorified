export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round(value: number, precision = 2): number {
  const multiplier = 10 ** precision;
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

export function weightedAverage(items: Array<{ value: number; weight: number }>): number {
  const totalWeight = items.reduce((total, item) => total + item.weight, 0);
  if (totalWeight <= 0) return 0;
  return items.reduce((total, item) => total + item.value * item.weight, 0) / totalWeight;
}
