import { newId, nowIso, type Profile } from "./types";

export function defaultProfile(id: string = newId()): Profile {
  return {
    id,
    displayName: null,
    memoryEnabled: true,
    voiceId: null,
    region: null,
    consentedAt: null,
    clientSummary: null,
    clientSummaryUpdatedAt: null,
    createdAt: nowIso(),
  };
}
