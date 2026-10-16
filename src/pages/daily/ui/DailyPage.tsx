import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/entities/game";
import { useGuess } from "@/features/guess-country";
import { useHints } from "@/features/hint-system";
import { RoundSpread } from "@/widgets/round-spread";
import { DailyResult } from "@/widgets/daily-result";
import {
  getDailyChallenge,
  getDailyStatus,
  getDailyLeaderboard,
  submitDailyScore,
} from "@/entities/game/api/dailyApi";
import { Button } from "@/shared/ui";
import type { GameRound } from "@/entities/game";

type LeaderboardEntry = {
  /** Marked by the server: the client no longer knows its own player id. */
  isYou: boolean;
  totalScore: number;
  completedAt: string;
};

function generateShareText(
  date: string,
  totalScore: number,
  maxScore: number,
  rounds: GameRound[]
): string {
  const roundEmojis = rounds
    .map((r) => {
      if (!r.result) return "\u2B1C";
      const score = r.result.score;
      if (score >= 4000) return "\uD83D\uDFE9";
      if (score >= 2000) return "\uD83D\uDFE8";
      return "\uD83D\uDFE5";
    })
    .join("");

  return `AviGuessr Daily ${date} \u2014 ${totalScore.toLocaleString()}/${maxScore.toLocaleString()}\n${roundEmojis}`;
}

export function DailyPage() {
  const navigate = useNavigate();
  const game = useGame();
  const [gameId, setGameId] = useState<string | null>(null);
  const { guess, loading: guessLoading } = useGuess(gameId);
  const { hints, revealHint, loading: hintsLoading } = useHints(
    gameId,
    game.currentRound
  );
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [dailyDate, setDailyDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedScore, setCompletedScore] = useState<number | null>(null);
  const [completedRounds, setCompletedRounds] = useState<GameRound[] | null>(
    null
  );
  /** A perfect game of the day's birds, which varies with their ranges. */
  const [maxScore, setMaxScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  /** Days in a row, which only the server can count. */
  const [streakDays, setStreakDays] = useState<number | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const status = await getDailyStatus();
        setDailyDate(status.date);
        setStreakDays(status.streakDays);

        if (status.completed) {
          setCompletedScore(status.totalScore);
          setMaxScore(status.maxScore ?? 0);
          if (status.roundsJson) {
            setCompletedRounds(JSON.parse(status.roundsJson) as GameRound[]);
          }
          const lb = await getDailyLeaderboard();
          setLeaderboard(lb.leaderboard);
          setLoading(false);
          return;
        }

        const challenge = await getDailyChallenge();
        setDailyDate(challenge.date);
        setGameId(challenge.gameId);
        setMaxScore(challenge.maxScore);
        game.startGame(
          challenge.gameId,
          challenge.rounds as GameRound[],
          challenge.maxScore
        );
        setLoading(false);
      } catch (err) {
        if (err instanceof Error && err.message.includes("409")) {
          // Already played - reload status
          const status = await getDailyStatus();
          setDailyDate(status.date);
          setCompletedScore(status.totalScore);
          if (status.roundsJson) {
            setCompletedRounds(JSON.parse(status.roundsJson) as GameRound[]);
          }
          const lb = await getDailyLeaderboard();
          setLeaderboard(lb.leaderboard);
          setLoading(false);
        } else {
          setError(
            err instanceof Error ? err.message : "Failed to load daily challenge"
          );
          setLoading(false);
        }
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Submit score when game finishes
  useEffect(() => {
    if (game.phase === "finished" && !scoreSubmitted && gameId) {
      submitDailyScore()
        .then(async (res) => {
          setScoreSubmitted(true);
          // The server's total is authoritative
          setCompletedScore(res.totalScore);
          setStreakDays(res.streakDays);
          setCompletedRounds(game.rounds);
          const lb = await getDailyLeaderboard();
          setLeaderboard(lb.leaderboard);
        })
        .catch(() => {
          // Score submission failed silently
        });
    }
  }, [game.phase, game.totalScore, game.rounds, scoreSubmitted, gameId]);

  const handleGuess = useCallback(async () => {
    if (!selectedCountry) return;
    const result = await guess(game.currentRound, selectedCountry);
    if (result) {
      game.showResult(result, selectedCountry);
    }
  }, [selectedCountry, game.currentRound, guess, game.showResult]);

  const handleTimeout = useCallback(async () => {
    const country = selectedCountry ?? "__TIMEOUT__";
    const result = await guess(game.currentRound, country);
    if (result) {
      game.showResult(result, country);
    }
  }, [game.currentRound, selectedCountry, guess, game.showResult]);

  const handleNext = useCallback(() => {
    setSelectedCountry(null);
    if (game.lastResult?.gameFinished) {
      game.finish();
    } else {
      game.nextRound();
    }
  }, [game.lastResult, game.nextRound, game.finish]);

  const handleShare = useCallback(async () => {
    const rounds = completedRounds ?? game.rounds;
    const score = completedScore ?? game.totalScore;
    const text = generateShareText(dailyDate, score, maxScore, rounds);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [
    completedRounds,
    completedScore,
    game.rounds,
    game.totalScore,
    dailyDate,
    maxScore,
  ]);

  const handleHome = useCallback(() => {
    game.reset();
    navigate("/");
  }, [game.reset, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--color-ink-soft)]">Loading daily challenge</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={handleHome}>Back to Home</Button>
      </div>
    );
  }

  // Already completed view
  if (completedScore !== null) {
    return (
      <DailyResult
        date={dailyDate}
        totalScore={completedScore}
        maxScore={maxScore}
        rounds={completedRounds}
        leaderboard={leaderboard}
        streakDays={streakDays}
        copied={copied}
        onShare={handleShare}
        onHome={handleHome}
      />
    );
  }

  // The same spread as the free game, so the two cannot drift apart
  const bird = game.currentBird;
  const result = game.phase === "showingResult" ? game.lastResult : null;

  if ((game.phase === "playing" || game.phase === "showingResult") && bird) {
    return (
      <RoundSpread
        bird={bird}
        currentRound={game.currentRound}
        totalScore={game.totalScore}
        currentStreak={game.currentStreak}
        roundStartTime={game.roundStartTime}
        result={result}
        selectedCountry={selectedCountry}
        guessLoading={guessLoading}
        hints={hints}
        hintCosts={game.currentHintCosts}
        hintsLoading={hintsLoading}
        onRevealHint={revealHint}
        onCountrySelect={setSelectedCountry}
        onGuess={handleGuess}
        onTimeout={handleTimeout}
        onNext={handleNext}
      />
    );
  }

  if (game.phase === "finished") {
    return (
      <DailyResult
        date={dailyDate}
        totalScore={game.totalScore}
        maxScore={game.maxScore}
        rounds={game.rounds}
        leaderboard={leaderboard}
        streakDays={streakDays}
        copied={copied}
        onShare={handleShare}
        onHome={handleHome}
      />
    );
  }

  return null;
}
