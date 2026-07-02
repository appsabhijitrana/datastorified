import type { DecisionProfile, DecisionProfileEnvelope } from "@datastorified/profile";
import type { DataStorifiedApiResult, DataStorifiedClient } from "./client";

export type ProfileApiResult = DataStorifiedApiResult<DecisionProfileEnvelope>;

export function getProfile(client: DataStorifiedClient): Promise<ProfileApiResult> {
  return client.profile.get();
}

export function updateProfile(client: DataStorifiedClient, profile: Partial<DecisionProfile>): Promise<ProfileApiResult> {
  return client.profile.update(profile);
}

export type ProfileEnvelope = DecisionProfileEnvelope;
