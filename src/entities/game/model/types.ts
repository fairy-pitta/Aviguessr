import type { Bird } from "../../bird/model/types";

export type GameRound = {
  round: number;
  bird: Bird;
  /** What each hint costs this round; the family hint is priced per bird. */
  hintCosts?: number[];
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
  /** Withheld by the question, because the family is what a hint sells. */
  family?: string | null;
  /**
   * What this player's history with the bird was before this round. Round
   * four is drawn from the birds they have met and never named, and the
   * re-encounter is only revealed here — knowing during the round would
   * narrow the bird to their own list.
   */
  encounter?: {
    count: number;
    previousGuess: string | null;
    everNamed: boolean;
  } | null;
  /** What the bird's range made this round worth, 1.0 being a median range. */
  rangeWeight?: number;
  roundMax?: number;
  rangeDescription?: string;
  funFact?: string;
};

export type GamePhase = "idle" | "playing" | "showingResult" | "finished";
