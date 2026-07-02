import { describe, expect, it } from "vitest";
import { CURRENT_LEGAL_VERSIONS, buildLegalAcceptanceStatus, requiresLegalAcceptance } from "./legalAcceptance";

describe("legal acceptance helpers", () => {
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
});

