import { WorldMap, COUNTRY_NAMES } from "@/entities/country";
import { PlatePage } from "@/entities/bird";
import { Button } from "@/shared/ui";
import type { GuessResponse } from "@/entities/game";
import type { Bird } from "@/entities/bird";

type RoundResultProps = {
  result: GuessResponse & { round: number };
  guessedCountry: string;
  bird: Bird;
  onNext: () => void;
};

function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}

/**
 * The spread completed: the species account arrives over the plate, and the
 * range map on the right is filled in — its range in the range wash, your
 * answer in the miss wash if it was wrong.
 */
export function RoundResult({
  result,
  guessedCountry,
  bird,
  onNext,
}: RoundResultProps) {
  const range = result.correctCountries.map(countryName);
  const shown = range.slice(0, 6);
  const rest = range.length - shown.length;

  return (
    <div className="min-h-screen bg-[var(--color-paper)] lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row">
      <div className="lg:w-[52%] lg:h-full h-[46vh] shrink-0">
        <PlatePage
          bird={bird}
          account={
            <div className="animate-account">
              <h2 className="text-2xl lg:text-3xl font-semibold leading-tight">
                {bird.name}
              </h2>
              {bird.family && (
                <p className="mt-1 text-base text-[#cfd6cc]">{bird.family}</p>
              )}
              {result.rangeDescription && (
                <p className="mt-3 text-base text-[#e4e9e2] leading-relaxed max-w-[42ch]">
                  {result.rangeDescription}
                </p>
              )}
              {result.funFact && (
                <p className="mt-2 text-base text-[#cfd6cc] leading-relaxed max-w-[48ch]">
                  {result.funFact}
                </p>
              )}
            </div>
          }
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col border-t lg:border-t-0 lg:border-l rule">
        <header className="px-5 lg:px-8 pt-5 lg:pt-6 pb-4 border-b rule">
          <p
            className="text-lg font-semibold"
            style={{
              color: result.isCorrect
                ? "var(--color-range)"
                : "var(--color-miss)",
            }}
          >
            {result.isCorrect
              ? "Within its range"
              : `${result.distanceKm.toLocaleString()} km outside its range`}
          </p>
          <p className="mt-1.5 text-base text-[var(--color-ink-soft)] leading-snug">
            Recorded in {shown.join(", ")}
            {rest > 0 && ` and ${rest} more`}
          </p>
        </header>

        <div className="flex-1 min-h-[38vh] lg:min-h-0">
          <WorldMap
            resultMode
            highlightCountries={{
              correct: result.correctCountries,
              incorrect: result.isCorrect ? undefined : guessedCountry,
            }}
          />
        </div>

        <footer className="px-5 lg:px-8 py-4 border-t rule">
          <dl className="flex items-baseline gap-6">
            <div>
              <dt className="text-sm text-[var(--color-ink-soft)]">Distance</dt>
              <dd className="text-xl font-semibold tabular">
                {result.score.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--color-ink-soft)]">Speed</dt>
              <dd className="text-xl font-semibold tabular">
                {result.timeBonus.toLocaleString()}
              </dd>
            </div>
            {result.streakLength > 0 && (
              <div>
                <dt className="text-sm text-[var(--color-ink-soft)]">
                  {result.streakLength} in a row
                </dt>
                <dd className="text-xl font-semibold tabular text-[var(--color-range)]">
                  {result.streakBonus.toLocaleString()}
                </dd>
              </div>
            )}
            <div className="ml-auto text-right">
              <dt className="text-sm text-[var(--color-ink-soft)]">Total</dt>
              <dd className="text-3xl font-semibold tabular leading-none">
                {result.totalScore.toLocaleString()}
              </dd>
            </div>
          </dl>

          <div className="mt-4">
            <Button onClick={onNext} className="w-full">
              {result.gameFinished ? "See your results" : "Next plate"}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
