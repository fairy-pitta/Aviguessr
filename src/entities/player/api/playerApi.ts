import { apiFetch } from "@/shared/api/client";

export type LifeListSummary = {
  species: number;
  named: number;
  bogeys: number;
};

export type PlayerResponse = {
  streakDays: number;
  lastDailyDate: string | null;
  hasRecoveryCode: boolean;
  lifeList: LifeListSummary;
};

export type LifeListEntry = {
  birdId: number;
  name: string;
  family: string | null;
  encounters: number;
  correct: number;
  bestScore: number;
  lastGuess: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  imageUrl: string;
};

export type LifeListResponse = {
  summary: LifeListSummary;
  entries: LifeListEntry[];
};

/** The player as they see themselves: the streak and the size of the list. */
export function getPlayer(): Promise<PlayerResponse> {
  return apiFetch<PlayerResponse>("/player");
}

export function getLifeList(): Promise<LifeListResponse> {
  return apiFetch<LifeListResponse>("/life-list");
}

/**
 * Mints a code that carries this list to another device.
 *
 * The code comes back here and nowhere else — the server keeps only its
 * hash — so whatever asks for one has to be what shows it.
 */
export function issueRecoveryCode(): Promise<{ code: string }> {
  return apiFetch<{ code: string }>("/player/recovery-code", {
    method: "POST",
  });
}

export function restoreFromCode(code: string): Promise<{ restored: boolean }> {
  return apiFetch<{ restored: boolean }>("/player/restore", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}
