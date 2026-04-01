import { apiFetch } from "@/shared/api/client";
import type { GameState, GuessResponse } from "../model/types";

type CreateGameResponse = {
  gameId: string;
  rounds: {
    round: number;
    bird: {
      id: number;
      name: string;
      family: string | null;
      difficulty: string;
      habitat?: string;
      biome?: string;
      imageUrl: string;
    };
  }[];
};

export function createGame(): Promise<CreateGameResponse> {
  return apiFetch<CreateGameResponse>("/game/new");
}

export function getGameState(id: string): Promise<GameState> {
  return apiFetch<GameState>(`/game/${id}`);
}

export function submitGuess(
  gameId: string,
  round: number,
  countryCode: string,
  timeMs: number,
  hintsUsed: number = 0
): Promise<GuessResponse> {
  return apiFetch<GuessResponse>(`/game/${gameId}/guess`, {
    method: "POST",
    body: JSON.stringify({ round, countryCode, timeMs, hintsUsed }),
  });
}

type HintResponse = {
  level: number;
  hint: string;
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
