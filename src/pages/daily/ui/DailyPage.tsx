import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/entities/game";
import { useGuess } from "@/features/guess-country";
import { useHints } from "@/features/hint-system";
import { GameBoard } from "@/widgets/game-board";
import { RoundResult } from "@/widgets/round-result";
import { GameSummary } from "@/widgets/game-summary";
import { getOrCreatePlayerId } from "@/shared/lib/playerId";
import { MAX_TOTAL_SCORE } from "@/shared/config/constants";
import {
  getDailyChallenge,
  getDailyStatus,
  getDailyLeaderboard,
  submitDailyScore,
} from "@/entities/game/api/dailyApi";
import { Button } from "@/shared/ui";
import type { GameRound } from "@/entities/game";

type LeaderboardEntry = {
  playerId: string;
  totalScore: number;
  completedAt: string;
};

function generateShareText(
  date: string,
  totalScore: number,
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

  return `AviGuessr Daily ${date} \u2014 ${totalScore.toLocaleString()}/${MAX_TOTAL_SCORE.toLocaleString()}\n${roundEmojis}`;
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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const playerId = getOrCreatePlayerId();
        const status = await getDailyStatus(playerId);
        setDailyDate(status.date);

        if (status.completed) {
          setCompletedScore(status.totalScore);
          if (status.roundsJson) {
            setCompletedRounds(JSON.parse(status.roundsJson) as GameRound[]);
          }
          const lb = await getDailyLeaderboard();
          setLeaderboard(lb.leaderboard);
          setLoading(false);
          return;
        }

        const challenge = await getDailyChallenge(playerId);
        setDailyDate(challenge.date);
        setGameId(challenge.gameId);
        game.startGame(challenge.gameId, challenge.rounds as GameRound[]);
        setLoading(false);
      } catch (err) {
        if (err instanceof Error && err.message.includes("409")) {
          // Already played - reload status
          const playerId = getOrCreatePlayerId();
          const status = await getDailyStatus(playerId);
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
      const playerId = getOrCreatePlayerId();
      submitDailyScore(playerId)
        .then(async (res) => {
          setScoreSubmitted(true);
          // The server's total is authoritative
          setCompletedScore(res.totalScore);
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
      game.showResult(result);
    }
  }, [selectedCountry, game.currentRound, guess, game.showResult]);

  const handleTimeout = useCallback(async () => {
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

  const handleShare = useCallback(async () => {
    const rounds = completedRounds ?? game.rounds;
    const score = completedScore ?? game.totalScore;
    const text = generateShareText(dailyDate, score, rounds);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [completedRounds, completedScore, game.rounds, game.totalScore, dailyDate]);

  const handleHome = useCallback(() => {
    game.reset();
    navigate("/");
  }, [game.reset, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--color-text-muted)]">Loading daily challenge</p>
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
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 max-w-lg w-full">
          <h1 className="text-3xl font-bold text-center mb-2">
            Daily Challenge
          </h1>
          <p className="text-center text-[var(--color-text-muted)] mb-4">{dailyDate}</p>
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-emerald-600">
              {completedScore.toLocaleString()}
            </div>
            <div className="text-[var(--color-text-muted)]">
              / {MAX_TOTAL_SCORE.toLocaleString()}
            </div>
          </div>

          {completedRounds && (
            <div className="space-y-3 mb-6">
              {completedRounds.map((round) => (
                <div
                  key={round.round}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[var(--color-text-muted)] tabular">
                      R{round.round}
                    </span>
                    <span className="font-medium">{round.bird.name}</span>
                  </div>
                  <div>
                    {round.result && (
                      <span
                        className={`font-semibold ${
                          round.result.score >= 4000
                            ? "text-emerald-600"
                            : round.result.score >= 2000
                              ? "text-yellow-600"
                              : "text-red-600"
                        }`}
                      >
                        {round.result.score.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {leaderboard.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Leaderboard</h2>
              <div className="space-y-2">
                {leaderboard.map((entry, i) => (
                  <div
                    key={entry.playerId}
                    className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/10"
                  >
                    <span className="text-sm text-[var(--color-text-muted)] tabular">#{i + 1}</span>
                    <span className="text-sm font-mono">
                      {entry.playerId.slice(0, 8)}...
                    </span>
                    <span className="font-semibold text-emerald-600">
                      {entry.totalScore.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <Button onClick={handleShare}>
              {copied ? "Copied!" : "Share Result"}
            </Button>
            <Button variant="secondary" onClick={handleHome}>
              Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Active game flow (reuses same components as GamePage)
  if (game.phase === "playing" && game.currentBird) {
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
        onRevealHint={revealHint}
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
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 max-w-lg w-full">
          <h1 className="text-3xl font-bold text-center mb-2">
            Daily Challenge Complete!
          </h1>
          <p className="text-center text-[var(--color-text-muted)] mb-4">{dailyDate}</p>
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-emerald-600">
              {game.totalScore.toLocaleString()}
            </div>
            <div className="text-[var(--color-text-muted)]">
              / {MAX_TOTAL_SCORE.toLocaleString()}
            </div>
          </div>

          <GameSummary
            rounds={game.rounds}
            totalScore={game.totalScore}
            onPlayAgain={handleHome}
          />

          {leaderboard.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Leaderboard</h2>
              <div className="space-y-2">
                {leaderboard.map((entry, i) => (
                  <div
                    key={entry.playerId}
                    className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/10"
                  >
                    <span className="text-sm text-[var(--color-text-muted)] tabular">#{i + 1}</span>
                    <span className="text-sm font-mono">
                      {entry.playerId.slice(0, 8)}...
                    </span>
                    <span className="font-semibold text-emerald-600">
                      {entry.totalScore.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center mt-4">
            <Button onClick={handleShare}>
              {copied ? "Copied!" : "Share Result"}
            </Button>
            <Button variant="secondary" onClick={handleHome}>
              Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
