import { COUNTRY_NAMES } from "@/entities/country";
import { Button, HandRule, BookPage } from "@/shared/ui";
import type { GameRound } from "@/entities/game";
import { MAX_TOTAL_SCORE } from "@/shared/config/constants";

type GameSummaryProps = {
  rounds: GameRound[];
  totalScore: number;
  onPlayAgain: () => void;
};

function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}

/**
 * The day's list. A birder's tally is a ruled column of species and where they
 * were seen, so the summary is set as one — no cards, no grade badge.
 */
export function GameSummary({
  rounds,
  totalScore,
  onPlayAgain,
}: GameSummaryProps) {
  const correct = rounds.filter((r) => r.result?.isCorrect).length;

  return (
    <BookPage>
      <div className="flex-1 flex justify-center px-5 py-10 lg:py-16">
        <div className="w-full max-w-2xl">
          <header className="pb-5">
            <p className="text-base text-[var(--color-ink-soft)]">
              {correct} of {rounds.length} within range
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
          <HandRule />

          <ol className="mt-2">
            {rounds.map((round) => (
              <li key={round.round}>
                <div className="flex items-baseline gap-4 py-3.5">
                  <span className="w-5 shrink-0 text-base text-[var(--color-ink-faint)] tabular">
                    {round.round}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-medium leading-snug">
                      {round.bird.name}
                    </span>
                    {round.result && (
                      <span className="block mt-0.5 text-base text-[var(--color-ink-soft)]">
                        You said{" "}
                        <span className="handwritten text-lg text-[var(--color-ink)]">
                          {countryName(round.result.guessedCountry)}
                        </span>
                      </span>
                    )}
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

          <div className="mt-8 flex items-center gap-4">
            <Button onClick={onPlayAgain}>Start a new round</Button>
          </div>
        </div>
      </div>
    </BookPage>
  );
}
