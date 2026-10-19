import { Button, HandRule, BookPage } from "@/shared/ui";
import type { GameRound } from "@/entities/game";

export type LeaderboardEntry = {
  /** Marked by the server: the client no longer knows its own player id. */
  isYou: boolean;
  totalScore: number;
  completedAt: string;
};

type DailyResultProps = {
  date: string;
  totalScore: number;
  /** A perfect game of the day's five birds, which varies with their ranges. */
  maxScore: number;
  rounds: GameRound[] | null;
  leaderboard: LeaderboardEntry[];
  /** Days in a row, or null before the server has said. */
  streakDays: number | null;
  copied: boolean;
  onShare: () => void;
  onHome: () => void;
  /** The list the day's five birds have just joined. */
  onSeeList: () => void;
};

/**
 * The day's page, shared by the just-finished and already-played views so the
 * two cannot drift apart.
 */
export function DailyResult({
  date,
  totalScore,
  maxScore,
  rounds,
  leaderboard,
  streakDays,
  copied,
  onShare,
  onHome,
  onSeeList,
}: DailyResultProps) {
  return (
    <BookPage>
      <div className="flex-1 flex justify-center px-5 py-10 lg:py-16">
        <div className="w-full max-w-2xl">
          <header className="pb-5">
            <p className="flex items-baseline gap-3 text-base text-[var(--color-ink-soft)]">
              <span className="tabular">{date}</span>
              {streakDays !== null && streakDays > 0 && (
                <span className="handwritten text-lg text-[var(--color-ink)]">
                  {streakDays === 1
                    ? "first day"
                    : `${streakDays} days running`}
                </span>
              )}
            </p>
            <p className="mt-2 flex items-baseline gap-3">
              <span className="text-6xl font-semibold tabular leading-none">
                {totalScore.toLocaleString()}
              </span>
              <span className="text-base text-[var(--color-ink-soft)] tabular">
                of {maxScore.toLocaleString()}
              </span>
            </p>
          </header>
          <HandRule />

          {rounds && rounds.length > 0 && (
            <ol className="mt-2">
              {rounds.map((round) => (
                <li key={round.round}>
                  <div className="flex items-baseline gap-4 py-3.5">
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
                  </div>
                  <HandRule />
                </li>
              ))}
            </ol>
          )}

          {leaderboard.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-semibold pb-1.5">Today's highest</h2>
              <HandRule />
              <ol>
                {leaderboard.map((entry, i) => {
                  const isYou = entry.isYou;
                  return (
                    <li key={`${i}-${entry.completedAt}`}>
                      <div className="flex items-baseline gap-4 py-2.5">
                        <span className="w-5 shrink-0 text-base text-[var(--color-ink-faint)] tabular">
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1 text-base">
                          {isYou ? (
                            <span className="handwritten text-xl">You</span>
                          ) : (
                            <span className="text-[var(--color-ink-soft)]">
                              Another birder
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-base font-semibold tabular">
                          {entry.totalScore.toLocaleString()}
                        </span>
                      </div>
                      <HandRule />
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
            <Button variant="ghost" onClick={onSeeList}>
              Your life list
            </Button>
            <Button variant="ghost" onClick={onHome}>
              Back to the guide
            </Button>
          </div>
        </div>
      </div>
    </BookPage>
  );
}
