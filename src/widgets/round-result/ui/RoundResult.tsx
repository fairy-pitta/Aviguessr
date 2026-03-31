import { WorldMap } from "@/entities/country";
import { COUNTRY_NAMES } from "@/entities/country";
import { Button } from "@/shared/ui";
import type { GuessResponse } from "@/entities/game";

type RoundResultProps = {
  result: GuessResponse & { round: number };
  guessedCountry: string;
  onNext: () => void;
};

function countryName(code: string): string {
  return COUNTRY_NAMES[code] || code;
}

export function RoundResult({
  result,
  guessedCountry,
  onNext,
}: RoundResultProps) {
  return (
    <div className="relative h-screen w-full">
      <WorldMap
        resultMode
        highlightCountries={{
          correct: result.correctCountries,
          incorrect: result.isCorrect ? undefined : guessedCountry,
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 pointer-events-auto">
          <h2
            className={`text-3xl font-bold text-center mb-4 ${
              result.isCorrect ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {result.isCorrect ? "Correct!" : "Wrong!"}
          </h2>

          {!result.isCorrect && (
            <p className="text-center text-gray-600 mb-2">
              Distance: {result.distanceKm.toLocaleString()} km
            </p>
          )}

          <div className="text-center mb-2 text-sm text-gray-500">
            Correct:{" "}
            {result.correctCountries.map(countryName).join(", ")}
          </div>

          <div className="grid grid-cols-2 gap-4 my-4 text-center">
            <div>
              <div className="text-2xl font-bold text-emerald-700">
                {result.score.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Distance Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                +{result.timeBonus.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Time Bonus</div>
            </div>
          </div>

          <div className="text-center mb-6">
            <span className="text-lg font-semibold">
              Total: {result.totalScore.toLocaleString()}
            </span>
          </div>

          <div className="text-center">
            <Button onClick={onNext}>
              {result.gameFinished ? "See Results" : "Next Round"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
