let sequence = 0;

export function createDecisionId(prefix = "decision"): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") return `${prefix}_${cryptoApi.randomUUID()}`;
  sequence += 1;
  return `${prefix}_${Date.now().toString(36)}_${sequence.toString(36)}`;
}
