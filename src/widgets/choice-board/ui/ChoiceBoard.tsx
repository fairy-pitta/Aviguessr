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
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col items-center px-4 py-6">
      {/* Top bar */}
      <div className="w-full max-w-2xl flex items-start justify-between gap-4 mb-6">
        <div className="flex flex-col gap-3">
          <ScorePanel currentRound={currentRound} totalScore={totalScore} />
          <div className="w-64">
            <Timer startTime={roundStartTime} onTimeout={onTimeout} />
          </div>
        </div>
      </div>

      {/* Bird card centered */}
      <div className="mb-8">
        <BirdCard bird={bird} />
      </div>

      {/* 4 country buttons */}
      <div className="w-full max-w-md grid grid-cols-2 gap-3">
        {choices.map((code) => (
          <button
            key={code}
            disabled={guessLoading}
            onClick={() => onChoiceSelect(code)}
            className="px-4 py-3 bg-white border-2 border-emerald-200 rounded-lg font-medium text-gray-800 hover:bg-emerald-50 hover:border-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-center"
          >
            {COUNTRY_NAMES[code] ?? code}
          </button>
        ))}
      </div>
    </div>
  );
}
