import { useCallback, useState } from "react";
import type {
  GamePhase,
  GameRound,
  GuessResponse,
} from "./types";

type GameHookState = {
  gameId: string | null;
  /** A perfect game of these five birds, which varies with their ranges. */
  maxScore: number;
  phase: GamePhase;
  rounds: GameRound[];
  currentRound: number;
  totalScore: number;
  currentStreak: number;
  lastResult: (GuessResponse & { round: number }) | null;
  roundStartTime: number;
};

const initialState: GameHookState = {
  gameId: null,
  maxScore: 0,
  phase: "idle",
  rounds: [],
  currentRound: 1,
  totalScore: 0,
  currentStreak: 0,
  lastResult: null,
  roundStartTime: 0,
};

export function useGame() {
  const [state, setState] = useState<GameHookState>(initialState);

  const startGame = useCallback(
    (gameId: string, rounds: GameRound[], maxScore = 0) => {
      setState({
        gameId,
        maxScore,
        phase: "playing",
        rounds,
        currentRound: 1,
        totalScore: 0,
        currentStreak: 0,
        lastResult: null,
        roundStartTime: Date.now(),
      });
    },
    []
  );

  /**
   * Records a round's answer.
   *
   * The result page is shown for every round including the last. It used to
   * go straight to the tally once the server said the game was over, so the
   * fifth bird was the one round whose range map, species account and verdict
   * the player never saw — the round they most wanted them for.
   *
   * The result is also written against its round, because the tally reads
   * those. Nothing wrote them, so every game ended "0 of 5 within range"
   * with no score beside any bird.
   */
  const showResult = useCallback(
    (result: GuessResponse, guessedCountry = "") => {
      setState((prev) => ({
        ...prev,
        phase: "showingResult",
        totalScore: result.totalScore,
        currentStreak: result.isCorrect ? result.streakLength + 1 : 0,
        lastResult: { ...result, round: prev.currentRound },
        rounds: prev.rounds.map((round) =>
          round.round === prev.currentRound
            ? {
                ...round,
                result: {
                  guessedCountry,
                  isCorrect: result.isCorrect,
                  distanceKm: result.distanceKm,
                  score: result.score,
                  timeMs: 0,
                },
              }
            : round
        ),
      }));
    },
    []
  );

  /** Turn the last page: the tally, once the player has read the fifth result. */
  const finish = useCallback(() => {
    setState((prev) => ({ ...prev, phase: "finished" }));
  }, []);

  const nextRound = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: "playing",
      currentRound: prev.currentRound + 1,
      lastResult: null,
      roundStartTime: Date.now(),
    }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const currentRoundData =
    state.rounds.length > 0 && state.currentRound <= state.rounds.length
      ? state.rounds[state.currentRound - 1]
      : null;

  const currentBird = currentRoundData?.bird ?? null;

  return {
    ...state,
    currentBird,
    startGame,
    showResult,
    finish,
    nextRound,
    reset,
  };
}
