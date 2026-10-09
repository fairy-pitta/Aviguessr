import { PlatePage } from "@/entities/bird";
import { BookSpread } from "@/shared/ui";
import { GuessPage } from "@/widgets/guess-page";
import { ResultPage, BirdAccount } from "@/widgets/result-page";
import type { Bird } from "@/entities/bird";
import type { GuessResponse } from "@/entities/game";

type RoundSpreadProps = {
  bird: Bird;
  currentRound: number;
  totalScore: number;
  currentStreak: number;
  roundStartTime: number;
  /** Present once the round is answered, which fills the spread in. */
  result: (GuessResponse & { round: number }) | null;
  selectedCountry: string | null;
  guessLoading: boolean;
  hints: string[];
  hintsLoading: number | null;
  onRevealHint: (level: number) => void;
  onCountrySelect: (code: string) => void;
  onGuess: () => void;
  onTimeout: () => void;
  onNext: () => void;
};

/**
 * One round as a spread of the notebook, used by both the free game and the
 * daily so the two cannot drift apart.
 *
 * Asking and answering are the same spread: answering fills the page in, and
 * only advancing the round turns it. That is why the result is a prop here
 * rather than a separate screen — a separate screen would unmount the book
 * and there would be nothing to turn.
 */
export function RoundSpread({
  bird,
  currentRound,
  totalScore,
  currentStreak,
  roundStartTime,
  result,
  selectedCountry,
  guessLoading,
  hints,
  hintsLoading,
  onRevealHint,
  onCountrySelect,
  onGuess,
  onTimeout,
  onNext,
}: RoundSpreadProps) {
  return (
    <BookSpread
      turnKey={currentRound}
      left={
        <PlatePage
          bird={bird}
          account={
            result ? <BirdAccount bird={bird} result={result} /> : undefined
          }
        />
      }
      right={
        result ? (
          <ResultPage
            result={result}
            guessedCountry={selectedCountry ?? ""}
            onNext={onNext}
          />
        ) : (
          <GuessPage
            currentRound={currentRound}
            totalScore={totalScore}
            currentStreak={currentStreak}
            selectedCountry={selectedCountry}
            roundStartTime={roundStartTime}
            guessLoading={guessLoading}
            hints={hints}
            hintsLoading={hintsLoading}
            onRevealHint={onRevealHint}
            onCountrySelect={onCountrySelect}
            onGuess={onGuess}
            onTimeout={onTimeout}
          />
        )
      }
    />
  );
}
