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

export function createGame(playerId: string): Promise<CreateGameResponse> {
  return apiFetch<CreateGameResponse>("/game/new", {
    headers: { "X-Player-Id": playerId },
  });
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
