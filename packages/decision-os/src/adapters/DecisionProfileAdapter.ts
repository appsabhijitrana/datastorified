import type { ProfileCompleteness, DecisionProfile, DecisionProfileEnvelope } from "@datastorified/profile";

export interface DecisionProfileAdapter {
  getProfile(): Promise<DecisionProfileEnvelope>;
  updateProfile(profile: Partial<DecisionProfile>): Promise<DecisionProfileEnvelope>;
  getCompleteness(): Promise<ProfileCompleteness>;
}
