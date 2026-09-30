import { BirdCard } from "@/entities/bird";
import { ScorePanel } from "@/entities/game";
import { COUNTRY_NAMES } from "@/entities/country";
import { Timer } from "@/shared/ui";
import type { Bird } from "@/entities/bird";

type ChoiceBoardProps = {
  bird: Bird;
  currentRound: number;
  totalScore: number;
  choices: string[];
  roundStartTime: number;
  guessLoading: boolean;
  onChoiceSelect: (countryCode: string) => void;
  onTimeout: () => void;
};

export function ChoiceBoard({
  bird,
  currentRound,
  totalScore,
  choices,
  roundStartTime,
  guessLoading,
  onChoiceSelect,
  onTimeout,
}: ChoiceBoardProps) {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex flex-col items-center px-4 py-6">
      <div className="w-full max-w-sm glass rounded-xl px-5 py-4 mb-6">
        <Timer startTime={roundStartTime} onTimeout={onTimeout} />
        <div className="mt-4 pt-3 border-t border-white/10">
          <ScorePanel currentRound={currentRound} totalScore={totalScore} />
        </div>
      </div>

      <div className="mb-8">
        <BirdCard bird={bird} />
      </div>

      <div className="w-full max-w-md grid grid-cols-2 gap-3">
        {choices.map((code) => (
          <button
            key={code}
            disabled={guessLoading}
            onClick={() => onChoiceSelect(code)}
            className="px-4 py-4 glass rounded-xl font-semibold text-base text-[var(--color-text-strong)] border border-white/15 hover:border-teal-300/60 hover:bg-teal-400/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-center"
          >
            {COUNTRY_NAMES[code] ?? code}
          </button>
        ))}
      </div>
    </div>
  );
}
