import { ScorePanel } from "@/entities/game";
import { COUNTRY_NAMES } from "@/entities/country";
import { Timer, HandRule } from "@/shared/ui";

type ChoicePageProps = {
  currentRound: number;
  totalScore: number;
  choices: string[];
  roundStartTime: number;
  guessLoading: boolean;
  onChoiceSelect: (countryCode: string) => void;
  onTimeout: () => void;
};

/** The same right page, with four ruled answers where the map would be. */
export function ChoicePage({
  currentRound,
  totalScore,
  choices,
  roundStartTime,
  guessLoading,
  onChoiceSelect,
  onTimeout,
}: ChoicePageProps) {
  return (
    <>
      <header className="flex items-baseline justify-between gap-4 px-5 lg:px-8 pt-5 lg:pt-6 pb-4">
        <ScorePanel currentRound={currentRound} totalScore={totalScore} />
        <Timer startTime={roundStartTime} onTimeout={onTimeout} />
      </header>
      <HandRule />

      <div className="flex-1 flex flex-col justify-center px-5 lg:px-8 py-6">
        <ul>
          {choices.map((code) => (
            <li key={code}>
              <button
                type="button"
                disabled={guessLoading}
                onClick={() => onChoiceSelect(code)}
                className="w-full text-left py-4 text-2xl font-medium hover:pl-2 transition-all disabled:opacity-50"
              >
                {COUNTRY_NAMES[code] ?? code}
              </button>
              <HandRule />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
