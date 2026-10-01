import { WorldMap } from "@/entities/country";
import { PlatePage } from "@/entities/bird";
import { ScorePanel } from "@/entities/game";
import { Timer, HandRule } from "@/shared/ui";
import { GuessButton } from "@/features/guess-country";
import { HintPanel } from "@/features/hint-system";
import type { Bird } from "@/entities/bird";

type GameBoardProps = {
  bird: Bird;
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
 * A guide spread. The plate is the left page and fills it; the right page is
 * the range map you have to fill in, with the account of the bird withheld
 * until the round resolves.
 */
export function GameBoard({
  bird,
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
}: GameBoardProps) {
  return (
    <div className="min-h-screen paper-grid lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row">
      <div className="lg:w-[52%] lg:h-full h-[46vh] shrink-0">
        <PlatePage bird={bird} />
      </div>

      {/* The gutter, sewn rather than ruled */}
      <div className="hidden lg:block w-[4px] shrink-0">
        <HandRule vertical stitched tone="soft" />
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <HandRule className="lg:hidden" stitched tone="soft" />
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
      </div>
    </div>
  );
}
