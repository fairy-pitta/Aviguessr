import { Button } from "@/shared/ui";
import { MAX_TOTAL_SCORE } from "@/shared/config/constants";
import type { GameRound } from "@/entities/game";

export type LeaderboardEntry = {
  playerId: string;
  totalScore: number;
  completedAt: string;
};

type DailyResultProps = {
  date: string;
  totalScore: number;
  rounds: GameRound[] | null;
  leaderboard: LeaderboardEntry[];
  playerId: string;
  copied: boolean;
  onShare: () => void;
  onHome: () => void;
};

/**
 * The day's page, shared by the just-finished and already-played views so the
 * two cannot drift apart.
 */
export function DailyResult({
  date,
  totalScore,
  rounds,
  leaderboard,
  playerId,
  copied,
  onShare,
  onHome,
}: DailyResultProps) {
  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex justify-center px-5 py-10 lg:py-16">
      <div className="w-full max-w-2xl">
        <header className="border-b rule pb-6">
          <p className="text-base text-[var(--color-ink-soft)] tabular">
            {date}
          </p>
          <p className="mt-2 flex items-baseline gap-3">
            <span className="text-6xl font-semibold tabular leading-none">
              {totalScore.toLocaleString()}
            </span>
            <span className="text-base text-[var(--color-ink-soft)] tabular">
              of {MAX_TOTAL_SCORE.toLocaleString()}
            </span>
          </p>
        </header>

        {rounds && rounds.length > 0 && (
          <ol className="mt-2">
            {rounds.map((round) => (
              <li
                key={round.round}
                className="flex items-baseline gap-4 py-4 border-b rule"
              >
                <span className="w-5 shrink-0 text-base text-[var(--color-ink-faint)] tabular">
                  {round.round}
                </span>
                <span className="min-w-0 flex-1 text-lg font-medium">
                  {round.bird.name}
                </span>
                {round.result && (
                  <span
                    className="shrink-0 text-lg font-semibold tabular"
                    style={{
                      color: round.result.isCorrect
                        ? "var(--color-range)"
                        : "var(--color-miss)",
                    }}
                  >
                    {round.result.score.toLocaleString()}
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}

        {leaderboard.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold border-b rule pb-2">
              Today's highest
            </h2>
            <ol>
              {leaderboard.map((entry, i) => {
                const isYou = entry.playerId === playerId;
                return (
                  <li
                    key={entry.playerId}
                    className="flex items-baseline gap-4 py-3 border-b rule"
                  >
                    <span className="w-5 shrink-0 text-base text-[var(--color-ink-faint)] tabular">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 text-base">
                      {isYou ? (
                        <span className="font-semibold">You</span>
                      ) : (
                        <span className="text-[var(--color-ink-soft)]">
                          Another birder
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-base font-semibold tabular">
                      {entry.totalScore.toLocaleString()}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        <div className="mt-8 flex items-center gap-4">
          <Button onClick={onShare}>
            {copied ? "Copied" : "Copy your result"}
          </Button>
          <Button variant="ghost" onClick={onHome}>
            Back to the guide
          </Button>
        </div>
      </div>
    </div>
  );
}
