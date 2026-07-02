export type LegalAcceptanceVersions = {
  termsVersion: string;
  privacyVersion: string;
  legalAcceptanceVersion: string;
};

export type LegalAcceptanceMarker = LegalAcceptanceVersions & {
  accepted: true;
  acceptedAt: string;
};

export type LegalAcceptanceStatus = {
  acceptedCurrentTerms: boolean;
  acceptedCurrentPrivacy: boolean;
  acceptedCurrentLegal: boolean;
  requiresAcceptance: boolean;
  currentVersions: LegalAcceptanceVersions;
};

export type LegalAcceptanceInput = {
  termsVersion: string;
  privacyVersion: string;
  legalAcceptanceVersion: string;
  acceptedAt: string;
};

export type LegalAcceptanceRecord = {
  termsAcceptedAt?: Date | string | null;
  termsVersion?: string | null;
  privacyAcceptedAt?: Date | string | null;
  privacyVersion?: string | null;
  legalAcceptedAt?: Date | string | null;
  legalAcceptanceVersion?: string | null;
};

