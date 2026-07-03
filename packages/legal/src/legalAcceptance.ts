import { CURRENT_LEGAL_ACCEPTANCE_VERSION, CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from "./constants";
import type { LegalAcceptanceInput, LegalAcceptanceMarker, LegalAcceptanceRecord, LegalAcceptanceStatus, LegalAcceptanceVersions } from "./types";

export const CURRENT_LEGAL_VERSIONS: LegalAcceptanceVersions = {
  termsVersion: CURRENT_TERMS_VERSION,
  privacyVersion: CURRENT_PRIVACY_VERSION,
  legalAcceptanceVersion: CURRENT_LEGAL_ACCEPTANCE_VERSION,
};

export const LEGAL_ACCEPTANCE_STORAGE_KEY = "ds.legal.acceptance.accepted";

function hasCurrentVersions(marker: Pick<LegalAcceptanceVersions, "termsVersion" | "privacyVersion" | "legalAcceptanceVersion"> | null | undefined): boolean {
  return Boolean(
    marker &&
      marker.termsVersion === CURRENT_TERMS_VERSION &&
      marker.privacyVersion === CURRENT_PRIVACY_VERSION &&
      marker.legalAcceptanceVersion === CURRENT_LEGAL_ACCEPTANCE_VERSION,
  );
}

export function requiresLegalAcceptance(user: LegalAcceptanceRecord | null | undefined): boolean {
  if (!user) return true;
  return !(
    user.termsAcceptedAt &&
    user.privacyAcceptedAt &&
    user.legalAcceptedAt &&
    user.termsVersion === CURRENT_TERMS_VERSION &&
    user.privacyVersion === CURRENT_PRIVACY_VERSION &&
    user.legalAcceptanceVersion === CURRENT_LEGAL_ACCEPTANCE_VERSION
  );
}

export function buildLegalAcceptanceStatus(user: LegalAcceptanceRecord | null | undefined): LegalAcceptanceStatus {
  const acceptedCurrentTerms = Boolean(user?.termsAcceptedAt) && user?.termsVersion === CURRENT_TERMS_VERSION;
  const acceptedCurrentPrivacy = Boolean(user?.privacyAcceptedAt) && user?.privacyVersion === CURRENT_PRIVACY_VERSION;
  const acceptedCurrentLegal = Boolean(user?.legalAcceptedAt) && user?.legalAcceptanceVersion === CURRENT_LEGAL_ACCEPTANCE_VERSION;
  return {
    acceptedCurrentTerms,
    acceptedCurrentPrivacy,
    acceptedCurrentLegal,
    requiresAcceptance: !(acceptedCurrentTerms && acceptedCurrentPrivacy && acceptedCurrentLegal),
    currentVersions: CURRENT_LEGAL_VERSIONS,
  };
}

export function buildPendingAcceptanceMarker(acceptedAt: string): LegalAcceptanceMarker {
  return {
    accepted: true,
    acceptedAt,
    ...CURRENT_LEGAL_VERSIONS,
  };
}

export function getStoredLegalAcceptanceMarker(): LegalAcceptanceMarker | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LEGAL_ACCEPTANCE_STORAGE_KEY);
    return parseLegalAcceptanceMarker(raw);
  } catch {
    return null;
  }
}

export function hasStoredCurrentLegalAcceptance(): boolean {
  return hasCurrentVersions(getStoredLegalAcceptanceMarker());
}

export function storeLegalAcceptanceMarker(marker: LegalAcceptanceMarker): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(LEGAL_ACCEPTANCE_STORAGE_KEY, serializeLegalAcceptanceMarker(marker));
    return true;
  } catch {
    return false;
  }
}

export function clearStoredLegalAcceptanceMarker(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LEGAL_ACCEPTANCE_STORAGE_KEY);
  } catch {
    // ignore storage failures
  }
}

export function parseLegalAcceptanceMarker(value: string | null): LegalAcceptanceMarker | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<LegalAcceptanceMarker>;
    if (
      parsed?.accepted === true &&
      typeof parsed.acceptedAt === "string" &&
      typeof parsed.termsVersion === "string" &&
      typeof parsed.privacyVersion === "string" &&
      typeof parsed.legalAcceptanceVersion === "string"
    ) {
      return {
        accepted: true,
        acceptedAt: parsed.acceptedAt,
        termsVersion: parsed.termsVersion,
        privacyVersion: parsed.privacyVersion,
        legalAcceptanceVersion: parsed.legalAcceptanceVersion,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function serializeLegalAcceptanceMarker(marker: LegalAcceptanceMarker): string {
  return JSON.stringify(marker);
}

export function buildLegalAcceptanceInput(marker: LegalAcceptanceMarker): LegalAcceptanceInput {
  return {
    termsVersion: marker.termsVersion,
    privacyVersion: marker.privacyVersion,
    legalAcceptanceVersion: marker.legalAcceptanceVersion,
    acceptedAt: marker.acceptedAt,
  };
}
