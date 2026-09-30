import { WorldMap } from "@/entities/country";
import { PlatePage } from "@/entities/bird";
import { ScorePanel } from "@/entities/game";
import { Timer } from "@/shared/ui";
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
    <div className="min-h-screen bg-[var(--color-paper)] lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row">
      <div className="lg:w-[52%] lg:h-full h-[46vh] shrink-0">
        <PlatePage bird={bird} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col border-t lg:border-t-0 lg:border-l rule">
        <header className="flex items-baseline justify-between gap-4 px-5 lg:px-8 pt-5 lg:pt-6 pb-4 border-b rule">
          <ScorePanel
            currentRound={currentRound}
            totalScore={totalScore}
            currentStreak={currentStreak}
          />
          <Timer startTime={roundStartTime} onTimeout={onTimeout} />
        </header>

        <div className="flex-1 min-h-[42vh] lg:min-h-0 relative">
          <WorldMap
            onCountrySelect={onCountrySelect}
            selectedCountry={selectedCountry}
          />
          <div className="absolute bottom-4 left-4 z-10 max-w-[18rem]">
            <HintPanel
              hints={hints}
              loading={hintsLoading}
              onReveal={onRevealHint}
            />
          </div>
        </div>

        <footer className="px-5 lg:px-8 py-4 border-t rule">
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
