import type { Bird } from "../../bird/model/types";

export type GameRound = {
  round: number;
  bird: Bird;
  result: RoundResult | null;
};

export type RoundResult = {
  guessedCountry: string;
  isCorrect: boolean;
  distanceKm: number;
  score: number;
  timeMs: number;
};

export type GameState = {
  gameId: string;
  totalScore: number;
  currentRound: number;
  status: "playing" | "finished";
  rounds: GameRound[];
};

export type GuessResponse = {
  isCorrect: boolean;
  correctCountries: string[];
  distanceKm: number;
  score: number;
  timeBonus: number;
  totalScore: number;
  gameFinished: boolean;
};

export type GamePhase = "idle" | "playing" | "showingResult" | "finished";
