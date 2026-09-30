import { WorldMap } from "@/entities/country";
import { BirdCard } from "@/entities/bird";
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
    <div className="relative h-screen w-full">
      <WorldMap
        onCountrySelect={onCountrySelect}
        selectedCountry={selectedCountry}
      />

      {/* Status: one panel so the countdown reads as part of the same block */}
      <div className="absolute top-4 left-4 z-10 glass rounded-xl px-5 py-4 w-72">
        <Timer startTime={roundStartTime} onTimeout={onTimeout} />
        <div className="mt-4 pt-3 border-t border-white/10">
          <ScorePanel
            currentRound={currentRound}
            totalScore={totalScore}
            currentStreak={currentStreak}
          />
        </div>
      </div>

      {/* Bird card */}
      <div className="absolute top-4 right-4 z-10">
        <BirdCard bird={bird} />
      </div>

      {/* Hint panel */}
      <div className="absolute bottom-28 left-4 z-10">
        <HintPanel hints={hints} loading={hintsLoading} onReveal={onRevealHint} />
      </div>

      {/* Guess button */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <GuessButton
          selectedCountry={selectedCountry}
          loading={guessLoading}
          onGuess={onGuess}
        />
      </div>
    </div>
  );
}
