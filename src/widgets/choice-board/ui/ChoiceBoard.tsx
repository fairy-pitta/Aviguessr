import { PlatePage } from "@/entities/bird";
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

/** The same spread, with four ruled answers where the map would be. */
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
    <div className="min-h-screen bg-[var(--color-paper)] lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row">
      <div className="lg:w-[52%] lg:h-full h-[46vh] shrink-0">
        <PlatePage bird={bird} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col border-t lg:border-t-0 lg:border-l rule">
        <header className="flex items-baseline justify-between gap-4 px-5 lg:px-8 pt-5 lg:pt-6 pb-4 border-b rule">
          <ScorePanel currentRound={currentRound} totalScore={totalScore} />
          <Timer startTime={roundStartTime} onTimeout={onTimeout} />
        </header>

        <div className="flex-1 flex flex-col justify-center px-5 lg:px-8 py-6">
          <ul>
            {choices.map((code) => (
              <li key={code}>
                <button
                  type="button"
                  disabled={guessLoading}
                  onClick={() => onChoiceSelect(code)}
                  className="w-full text-left py-5 border-b rule text-2xl font-medium hover:pl-2 transition-all disabled:opacity-50"
                >
                  {COUNTRY_NAMES[code] ?? code}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
