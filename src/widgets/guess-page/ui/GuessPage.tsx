import { WorldMap } from "@/entities/country";
import { ScorePanel } from "@/entities/game";
import { Timer, HandRule } from "@/shared/ui";
import { GuessButton } from "@/features/guess-country";
import { HintPanel } from "@/features/hint-system";

type GuessPageProps = {
  currentRound: number;
  totalScore: number;
  currentStreak: number;
  selectedCountry: string | null;
  roundStartTime: number;
  guessLoading: boolean;
  hints: string[];
  hintsLoading: number | null;
  onRevealHint: (level: number) => void;
  onCountrySelect: (code: string) => void;
  onGuess: () => void;
  onTimeout: () => void;
};

/**
 * The right page while the question is open: the range map you have to fill
 * in, with the score above it and your answer below.
 */
export function GuessPage({
  currentRound,
  totalScore,
  currentStreak,
  selectedCountry,
  roundStartTime,
  guessLoading,
  hints,
  hintsLoading,
  onRevealHint,
  onCountrySelect,
  onGuess,
  onTimeout,
}: GuessPageProps) {
  return (
    <>
      <header className="flex items-baseline justify-between gap-4 px-5 lg:px-8 pt-5 lg:pt-6 pb-4">
        <ScorePanel
          currentRound={currentRound}
          totalScore={totalScore}
          currentStreak={currentStreak}
        />
        <Timer startTime={roundStartTime} onTimeout={onTimeout} />
      </header>
      <HandRule />

      <div className="h-[52vh] shrink-0 lg:h-auto lg:flex-1 lg:shrink lg:min-h-0">
        <WorldMap
          onCountrySelect={onCountrySelect}
          selectedCountry={selectedCountry}
        />
      </div>

      <HandRule />
      <div className="px-5 lg:px-8 py-3">
        <HintPanel
          hints={hints}
          loading={hintsLoading}
          onReveal={onRevealHint}
        />
      </div>
      <HandRule />
      <footer className="px-5 lg:px-8 py-4">
        <GuessButton
          selectedCountry={selectedCountry}
          loading={guessLoading}
          onGuess={onGuess}
        />
      </footer>
    </>
  );
}
