import { beforeEach, describe, expect, it } from "vitest";
import {
  CURRENT_LEGAL_VERSIONS,
  LEGAL_ACCEPTANCE_STORAGE_KEY,
  buildLegalAcceptanceStatus,
  buildPendingAcceptanceMarker,
  getStoredLegalAcceptanceMarker,
  hasStoredCurrentLegalAcceptance,
  requiresLegalAcceptance,
  storeLegalAcceptanceMarker,
} from "./legalAcceptance";

describe("legal acceptance helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("requires acceptance when versions are missing", () => {
    expect(requiresLegalAcceptance(null)).toBe(true);
    expect(requiresLegalAcceptance({})).toBe(true);
  });

  it("does not require acceptance when all current versions are present", () => {
    const current = {
      termsAcceptedAt: new Date(),
      termsVersion: CURRENT_LEGAL_VERSIONS.termsVersion,
      privacyAcceptedAt: new Date(),
      privacyVersion: CURRENT_LEGAL_VERSIONS.privacyVersion,
      legalAcceptedAt: new Date(),
      legalAcceptanceVersion: CURRENT_LEGAL_VERSIONS.legalAcceptanceVersion,
    };
    expect(requiresLegalAcceptance(current)).toBe(false);
    expect(buildLegalAcceptanceStatus(current).requiresAcceptance).toBe(false);
  });

  it("requires acceptance when versions are outdated", () => {
    const outdated = {
      termsAcceptedAt: new Date(),
      termsVersion: "old",
      privacyAcceptedAt: new Date(),
      privacyVersion: CURRENT_LEGAL_VERSIONS.privacyVersion,
      legalAcceptedAt: new Date(),
      legalAcceptanceVersion: CURRENT_LEGAL_VERSIONS.legalAcceptanceVersion,
    };
    expect(requiresLegalAcceptance(outdated)).toBe(true);
    expect(buildLegalAcceptanceStatus(outdated).acceptedCurrentTerms).toBe(false);
  });

  it("stores and reads the current legal acceptance locally", () => {
    const marker = buildPendingAcceptanceMarker("2026-07-03T10:00:00.000Z");
    expect(storeLegalAcceptanceMarker(marker)).toBe(true);
    expect(window.localStorage.getItem(LEGAL_ACCEPTANCE_STORAGE_KEY)).toBeTruthy();
    expect(hasStoredCurrentLegalAcceptance()).toBe(true);
    expect(getStoredLegalAcceptanceMarker()).toMatchObject({
      accepted: true,
      ...CURRENT_LEGAL_VERSIONS,
    });
  });
});
