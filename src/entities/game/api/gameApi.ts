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
  timeMs: number
): Promise<GuessResponse> {
  return apiFetch<GuessResponse>(`/game/${gameId}/guess`, {
    method: "POST",
    body: JSON.stringify({ round, countryCode, timeMs }),
  });
}
