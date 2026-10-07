import { apiFetch } from "@/shared/api/client";
import type { GameState, GuessResponse } from "../model/types";

type CreateGameResponse = {
  gameId: string;
  mode: "classic" | "multiple_choice";
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
    choices?: string[];
  }[];
};

export function createGame(
  mode: "classic" | "multiple_choice" | undefined,
  playerId: string
): Promise<CreateGameResponse> {
  const query = mode ? `?mode=${mode}` : "";
  return apiFetch<CreateGameResponse>(`/game/new${query}`, {
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
