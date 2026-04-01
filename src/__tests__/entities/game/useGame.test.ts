import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGame } from "@/entities/game/model/useGame";
import type { GameRound, GuessResponse } from "@/entities/game";

const mockRounds: GameRound[] = [
  { round: 1, bird: { id: 1, name: "Bird A", family: "Fam", difficulty: "easy", imageUrl: "/img/1" }, result: null },
  { round: 2, bird: { id: 2, name: "Bird B", family: "Fam", difficulty: "easy", imageUrl: "/img/2" }, result: null },
  { round: 3, bird: { id: 3, name: "Bird C", family: "Fam", difficulty: "medium", imageUrl: "/img/3" }, result: null },
  { round: 4, bird: { id: 4, name: "Bird D", family: "Fam", difficulty: "medium", imageUrl: "/img/4" }, result: null },
  { round: 5, bird: { id: 5, name: "Bird E", family: "Fam", difficulty: "hard", imageUrl: "/img/5" }, result: null },
];

describe("useGame", () => {
  it("test_initial_state_is_idle", () => {
    const { result } = renderHook(() => useGame());
    expect(result.current.phase).toBe("idle");
    expect(result.current.gameId).toBeNull();
    expect(result.current.currentBird).toBeNull();
  });

  it("test_start_game_transitions_to_playing", () => {
    const { result } = renderHook(() => useGame());
    act(() => {
      result.current.startGame("game-123", mockRounds);
    });
    expect(result.current.phase).toBe("playing");
    expect(result.current.gameId).toBe("game-123");
    expect(result.current.currentRound).toBe(1);
    expect(result.current.currentBird?.name).toBe("Bird A");
  });

  it("test_show_result_transitions_to_showing_result", () => {
    const { result } = renderHook(() => useGame());
    act(() => result.current.startGame("game-123", mockRounds));

    const guessResult: GuessResponse = {
      isCorrect: true,
      correctCountries: ["JP"],
      distanceKm: 0,
      score: 5000,
      timeBonus: 800,
      streakLength: 0,
      streakBonus: 0,
      totalScore: 5800,
      gameFinished: false,
    };

    act(() => result.current.showResult(guessResult));
    expect(result.current.phase).toBe("showingResult");
    expect(result.current.totalScore).toBe(5800);
  });

  it("test_show_result_with_game_finished_transitions_to_finished", () => {
    const { result } = renderHook(() => useGame());
    act(() => result.current.startGame("game-123", mockRounds));

    const guessResult: GuessResponse = {
      isCorrect: false,
      correctCountries: ["BR"],
      distanceKm: 5000,
      score: 410,
      timeBonus: 200,
      streakLength: 0,
      streakBonus: 0,
      totalScore: 610,
      gameFinished: true,
    };

    act(() => result.current.showResult(guessResult));
    expect(result.current.phase).toBe("finished");
  });

  it("test_next_round_increments_round_and_returns_to_playing", () => {
    const { result } = renderHook(() => useGame());
    act(() => result.current.startGame("game-123", mockRounds));

    act(() =>
      result.current.showResult({
        isCorrect: true,
        correctCountries: ["JP"],
        distanceKm: 0,
        score: 5000,
        timeBonus: 800,
        streakLength: 0,
        streakBonus: 0,
        totalScore: 5800,
        gameFinished: false,
      })
    );

    act(() => result.current.nextRound());
    expect(result.current.phase).toBe("playing");
    expect(result.current.currentRound).toBe(2);
    expect(result.current.currentBird?.name).toBe("Bird B");
  });

  it("test_reset_returns_to_initial_state", () => {
    const { result } = renderHook(() => useGame());
    act(() => result.current.startGame("game-123", mockRounds));
    act(() => result.current.reset());
    expect(result.current.phase).toBe("idle");
    expect(result.current.gameId).toBeNull();
  });
});
