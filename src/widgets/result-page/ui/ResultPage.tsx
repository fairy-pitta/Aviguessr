import { WorldMap, COUNTRY_NAMES } from "@/entities/country";
import { Button, HandRule } from "@/shared/ui";
import type { GuessResponse } from "@/entities/game";
import type { Bird } from "@/entities/bird";

function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}

/**
 * The species account, written onto the plate once the round is over. It is
 * the left page's caption, so it lives beside the page it belongs to.
 */
export function BirdAccount({
  bird,
  result,
}: {
  bird: Bird;
  result: GuessResponse;
}) {
  return (
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
  );
}

type ResultPageProps = {
  result: GuessResponse & { round: number };
  guessedCountry: string;
  onNext: () => void;
};

/**
 * The right page completed: the range map filled in — the bird's range in the
 * range hatch, your answer in the miss hatch if it was wrong.
 */
export function ResultPage({ result, guessedCountry, onNext }: ResultPageProps) {
  const range = result.correctCountries.map(countryName);
  const shown = range.slice(0, 6);
  const rest = range.length - shown.length;

  return (
    <>
      <header className="px-5 lg:px-8 pt-5 lg:pt-6 pb-4">
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
      <HandRule />

      <div className="h-[46vh] shrink-0 lg:h-auto lg:flex-1 lg:shrink lg:min-h-0">
        <WorldMap
          resultMode
          highlightCountries={{
            correct: result.correctCountries,
            incorrect: result.isCorrect ? undefined : guessedCountry,
          }}
        />
      </div>

      <HandRule />
      <footer className="px-5 lg:px-8 py-4">
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
            {result.gameFinished ? "See your results" : "Turn the page"}
          </Button>
        </div>
      </footer>
    </>
  );
}
