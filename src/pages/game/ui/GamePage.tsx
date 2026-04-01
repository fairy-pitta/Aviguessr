import { useCallback, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useGame } from "@/entities/game";
import { useGuess } from "@/features/guess-country";
import { useHints } from "@/features/hint-system";
import { GameBoard } from "@/widgets/game-board";
import { ChoiceBoard } from "@/widgets/choice-board";
import { RoundResult } from "@/widgets/round-result";
import { GameSummary } from "@/widgets/game-summary";
import { TIME_LIMIT_MS } from "@/shared/config/constants";
import type { GameRound } from "@/entities/game";
import { useEffect } from "react";

export function GamePage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const game = useGame();
  const { guess, loading: guessLoading } = useGuess(id ?? null);
  const { hints, hintsUsed, loading: hintsLoading } = useHints(
    id ?? null,
    game.currentRound,
    game.roundStartTime
  );
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Initialize game from navigation state
  useEffect(() => {
    if (id && game.phase === "idle") {
      const state = location.state as {
        rounds?: GameRound[];
        mode?: "classic" | "multiple_choice";
      } | null;
      if (state?.rounds) {
        game.startGame(id, state.rounds, state.mode ?? "classic");
      }
    }
  }, [id, game.phase, location.state, game.startGame]);

  const handleChoiceSelect = useCallback(
    async (countryCode: string) => {
      const timeMs = Date.now() - game.roundStartTime;
      const result = await guess(game.currentRound, countryCode, timeMs, 0);
      if (result) {
        setSelectedCountry(countryCode);
        game.showResult(result);
      }
    },
    [game.roundStartTime, game.currentRound, guess, game.showResult]
  );

  const handleGuess = useCallback(async () => {
    if (!selectedCountry) return;
    const timeMs = Date.now() - game.roundStartTime;
    const result = await guess(game.currentRound, selectedCountry, timeMs, hintsUsed);
    if (result) {
      game.showResult(result);
    }
  }, [selectedCountry, game.roundStartTime, game.currentRound, guess, game.showResult, hintsUsed]);

  const handleTimeout = useCallback(async () => {
    // Auto-submit with no country on timeout
    const result = await guess(game.currentRound, selectedCountry ?? "__TIMEOUT__", TIME_LIMIT_MS, hintsUsed);
    if (result) {
      game.showResult(result);
    }
  }, [game.currentRound, selectedCountry, guess, game.showResult, hintsUsed]);

  const handleNext = useCallback(() => {
    setSelectedCountry(null);
    if (game.lastResult?.gameFinished) {
      // Stay on finished phase
    } else {
      game.nextRound();
    }
  }, [game.lastResult, game.nextRound]);

  const handlePlayAgain = useCallback(() => {
    game.reset();
    navigate("/");
  }, [game.reset, navigate]);

  if (game.phase === "idle") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading game...</p>
      </div>
    );
  }

  if (game.phase === "playing" && game.currentBird) {
    if (game.mode === "multiple_choice" && game.currentChoices) {
      return (
        <ChoiceBoard
          bird={game.currentBird}
          currentRound={game.currentRound}
          totalScore={game.totalScore}
          choices={game.currentChoices}
          roundStartTime={game.roundStartTime}
          guessLoading={guessLoading}
          onChoiceSelect={handleChoiceSelect}
          onTimeout={handleTimeout}
        />
      );
    }

    return (
      <GameBoard
        bird={game.currentBird}
        currentRound={game.currentRound}
        totalScore={game.totalScore}
        currentStreak={game.currentStreak}
        selectedCountry={selectedCountry}
        roundStartTime={game.roundStartTime}
        guessLoading={guessLoading}
        hints={hints}
        hintsLoading={hintsLoading}
        onCountrySelect={setSelectedCountry}
        onGuess={handleGuess}
        onTimeout={handleTimeout}
      />
    );
  }

  if (game.phase === "showingResult" && game.lastResult && game.currentBird) {
    return (
      <RoundResult
        result={game.lastResult}
        guessedCountry={selectedCountry ?? ""}
        bird={game.currentBird}
        onNext={handleNext}
      />
    );
  }

  if (game.phase === "finished") {
    return (
      <GameSummary
        rounds={game.rounds}
        totalScore={game.totalScore}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  return null;
}
