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
  maxScore?: number;
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
  streakLength: number;
  streakBonus: number;
  totalScore: number;
  gameFinished: boolean;
  /** The whole name, including any place the question had inked out. */
  speciesName?: string;
  /** What the bird's range made this round worth, 1.0 being a median range. */
  rangeWeight?: number;
  roundMax?: number;
  rangeDescription?: string;
  funFact?: string;
};

export type GamePhase = "idle" | "playing" | "showingResult" | "finished";
