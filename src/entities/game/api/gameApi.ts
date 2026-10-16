import { apiFetch } from "@/shared/api/client";
import type { GameState, GuessResponse } from "../model/types";

type CreateGameResponse = {
  gameId: string;
  maxScore: number;
  rounds: {
    round: number;
    bird: {
      id: number;
      name: string;
      difficulty: string;
      habitat?: string;
      biome?: string;
      imageUrl: string;
    };
    /**
     * What each hint costs this round, as a fraction. The family hint is
     * priced by the family, so it is not a constant the client can hold.
     */
    hintCosts: number[];
  }[];
};

export function createGame(): Promise<CreateGameResponse> {
  // The player is a signed cookie the client never reads
  return apiFetch<CreateGameResponse>("/game/new");
}

export function getGameState(id: string): Promise<GameState> {
  return apiFetch<GameState>(`/game/${id}`);
}

export function submitGuess(
  gameId: string,
  round: number,
  countryCode: string
): Promise<GuessResponse> {
  // Elapsed time and hints used are measured by the server, not sent from here.
  return apiFetch<GuessResponse>(`/game/${gameId}/guess`, {
    method: "POST",
    body: JSON.stringify({ round, countryCode }),
  });
}

type HintResponse = {
  level: number;
  hint: string;
  /** What it actually cost, which for the family hint varies by bird. */
  penalty: number;
};

export function getHint(
  gameId: string,
  round: number,
  level: number
): Promise<HintResponse> {
  return apiFetch<HintResponse>(
    `/game/${gameId}/hint?round=${round}&level=${level}`
  );
}
