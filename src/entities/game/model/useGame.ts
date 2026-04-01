import { useCallback, useState } from "react";
import type {
  GamePhase,
  GameRound,
  GuessResponse,
} from "./types";

type GameHookState = {
  gameId: string | null;
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
    (gameId: string, rounds: GameRound[]) => {
      setState({
        gameId,
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

  const showResult = useCallback((result: GuessResponse) => {
    setState((prev) => ({
      ...prev,
      phase: result.gameFinished ? "finished" : "showingResult",
      totalScore: result.totalScore,
      currentStreak: result.isCorrect ? result.streakLength + 1 : 0,
      lastResult: { ...result, round: prev.currentRound },
    }));
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

  const currentBird =
    state.rounds.length > 0 && state.currentRound <= state.rounds.length
      ? state.rounds[state.currentRound - 1].bird
      : null;

  return {
    ...state,
    currentBird,
    startGame,
    showResult,
    nextRound,
    reset,
  };
}
