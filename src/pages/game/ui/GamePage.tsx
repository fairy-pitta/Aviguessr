import { useCallback, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useGame } from "@/entities/game";
import { useGuess } from "@/features/guess-country";
import { useHints } from "@/features/hint-system";
import { RoundSpread } from "@/widgets/round-spread";
import { GameSummary } from "@/widgets/game-summary";
import type { GameRound } from "@/entities/game";
import { useEffect } from "react";

export function GamePage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const game = useGame();
  const { guess, loading: guessLoading } = useGuess(id ?? null);
  const { hints, revealHint, loading: hintsLoading } = useHints(
    id ?? null,
    game.currentRound
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
      const result = await guess(game.currentRound, countryCode);
      if (result) {
        setSelectedCountry(countryCode);
        game.showResult(result);
      }
    },
    [game.currentRound, guess, game.showResult]
  );

  const handleGuess = useCallback(async () => {
    if (!selectedCountry) return;
    const result = await guess(game.currentRound, selectedCountry);
    if (result) {
      game.showResult(result);
    }
  }, [selectedCountry, game.currentRound, guess, game.showResult]);

  const handleTimeout = useCallback(async () => {
    // Auto-submit with no country on timeout
    const result = await guess(game.currentRound, selectedCountry ?? "__TIMEOUT__");
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
        <p className="text-[var(--color-ink-soft)]">Loading game</p>
      </div>
    );
  }

  const bird = game.currentBird;
  const result = game.phase === "showingResult" ? game.lastResult : null;

  if ((game.phase === "playing" || game.phase === "showingResult") && bird) {
    return (
      <RoundSpread
        bird={bird}
        mode={game.mode}
        currentRound={game.currentRound}
        totalScore={game.totalScore}
        currentStreak={game.currentStreak}
        choices={game.currentChoices}
        roundStartTime={game.roundStartTime}
        result={result}
        selectedCountry={selectedCountry}
        guessLoading={guessLoading}
        hints={hints}
        hintsLoading={hintsLoading}
        onRevealHint={revealHint}
        onCountrySelect={setSelectedCountry}
        onGuess={handleGuess}
        onChoiceSelect={handleChoiceSelect}
        onTimeout={handleTimeout}
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
