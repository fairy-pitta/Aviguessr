import { useCallback, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useGame } from "@/entities/game";
import { useGuess } from "@/features/guess-country";
import { GameBoard } from "@/widgets/game-board";
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
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Initialize game from navigation state
  useEffect(() => {
    if (id && game.phase === "idle") {
      const state = location.state as { rounds?: GameRound[] } | null;
      if (state?.rounds) {
        game.startGame(id, state.rounds);
      }
    }
  }, [id, game.phase, location.state, game.startGame]);

  const handleGuess = useCallback(async () => {
    if (!selectedCountry) return;
    const timeMs = Date.now() - game.roundStartTime;
    const result = await guess(game.currentRound, selectedCountry, timeMs);
    if (result) {
      game.showResult(result);
    }
  }, [selectedCountry, game.roundStartTime, game.currentRound, guess, game.showResult]);

  const handleTimeout = useCallback(async () => {
    // Auto-submit with no country on timeout
    const result = await guess(game.currentRound, selectedCountry ?? "__TIMEOUT__", TIME_LIMIT_MS);
    if (result) {
      game.showResult(result);
    }
  }, [game.currentRound, selectedCountry, guess, game.showResult]);

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
    return (
      <GameBoard
        bird={game.currentBird}
        currentRound={game.currentRound}
        totalScore={game.totalScore}
        selectedCountry={selectedCountry}
        roundStartTime={game.roundStartTime}
        guessLoading={guessLoading}
        onCountrySelect={setSelectedCountry}
        onGuess={handleGuess}
        onTimeout={handleTimeout}
      />
    );
  }

  if (game.phase === "showingResult" && game.lastResult) {
    return (
      <RoundResult
        result={game.lastResult}
        guessedCountry={selectedCountry ?? ""}
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
