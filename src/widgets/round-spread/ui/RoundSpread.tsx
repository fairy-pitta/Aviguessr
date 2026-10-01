import { PlatePage } from "@/entities/bird";
import { BookSpread } from "@/shared/ui";
import { GuessPage } from "@/widgets/guess-page";
import { ChoicePage } from "@/widgets/choice-page";
import { ResultPage, BirdAccount } from "@/widgets/result-page";
import type { Bird } from "@/entities/bird";
import type { GuessResponse } from "@/entities/game";

type RoundSpreadProps = {
  bird: Bird;
  mode: "classic" | "multiple_choice";
  currentRound: number;
  totalScore: number;
  currentStreak: number;
  choices: string[] | null;
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
  /** Absent where the mode cannot occur, as on the daily. */
  onChoiceSelect?: (code: string) => void;
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
  mode,
  currentRound,
  totalScore,
  currentStreak,
  choices,
  roundStartTime,
  result,
  selectedCountry,
  guessLoading,
  hints,
  hintsLoading,
  onRevealHint,
  onCountrySelect,
  onGuess,
  onChoiceSelect,
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
        ) : mode === "multiple_choice" && choices && onChoiceSelect ? (
          <ChoicePage
            currentRound={currentRound}
            totalScore={totalScore}
            choices={choices}
            roundStartTime={roundStartTime}
            guessLoading={guessLoading}
            onChoiceSelect={onChoiceSelect}
            onTimeout={onTimeout}
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
