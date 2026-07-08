import type { DecisionProfile, DecisionProfileEnvelope, PersonalizationSignal, ProgressiveProfileField, ProfilePromptRule } from "./types";
import { localProfileStorage } from "./storage/localProfileStorage";
import { buildPersonalizationSignal, PROFILE_PROMPT_RULES } from "./personalization";

export { localProfileStorage } from "./storage/localProfileStorage";

export function getLocalProfilePromptRules(): readonly ProfilePromptRule[] {
  return PROFILE_PROMPT_RULES;
}

export function addLocalProfilePreference(key: string, value: string | number | boolean | null): boolean {
  const current = localProfileStorage.getProfile();
  return localProfileStorage.saveProfile({
    preferences: {
      ...(current.profile?.preferences ?? {}),
      [key]: value,
    },
  });
}

export function getLocalProfileSignal(type: PersonalizationSignal["type"], data: Omit<PersonalizationSignal, "type" | "createdAt"> = {}): PersonalizationSignal {
  return buildPersonalizationSignal(type, data);
}

export function markProgressiveProfileField(field: ProgressiveProfileField, value: string | number | boolean | null): boolean {
  return addLocalProfilePreference(field, value);
}

export function saveLocalProfile(profile: Partial<DecisionProfile>): boolean {
  return localProfileStorage.saveProfile(profile);
}

export function saveLocalProfileEnvelope(envelope: DecisionProfileEnvelope): boolean {
  return localProfileStorage.saveEnvelope(envelope);
}
