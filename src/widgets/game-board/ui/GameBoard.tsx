import { WorldMap } from "@/entities/country";
import { BirdCard } from "@/entities/bird";
import { ScorePanel } from "@/entities/game";
import { Timer } from "@/shared/ui";
import { GuessButton } from "@/features/guess-country";
import type { Bird } from "@/entities/bird";

type GameBoardProps = {
  bird: Bird;
  currentRound: number;
  totalScore: number;
  currentStreak: number;
  selectedCountry: string | null;
  roundStartTime: number;
  guessLoading: boolean;
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

      {/* Top bar */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-3">
        <ScorePanel currentRound={currentRound} totalScore={totalScore} currentStreak={currentStreak} />
        <div className="w-64">
          <Timer
            startTime={roundStartTime}
            onTimeout={onTimeout}
          />
        </div>
      </div>

      {/* Bird card */}
      <div className="absolute top-4 right-4 z-10">
        <BirdCard bird={bird} />
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
