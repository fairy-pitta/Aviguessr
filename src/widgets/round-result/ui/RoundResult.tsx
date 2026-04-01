import { WorldMap } from "@/entities/country";
import { COUNTRY_NAMES } from "@/entities/country";
import { Button } from "@/shared/ui";
import type { GuessResponse } from "@/entities/game";
import type { Bird } from "@/entities/bird";

type RoundResultProps = {
  result: GuessResponse & { round: number };
  guessedCountry: string;
  bird: Bird;
  onNext: () => void;
};

function countryName(code: string): string {
  return COUNTRY_NAMES[code] || code;
}

export function RoundResult({
  result,
  guessedCountry,
  bird,
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

      {/* Right panel — same position as BirdCard during play */}
      <div className="absolute top-4 right-4 z-10 w-72">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
          <img
            src={bird.imageUrl}
            alt={bird.name}
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <h3 className="font-semibold text-gray-900">{bird.name}</h3>

            <h2
              className={`text-2xl font-bold mt-2 ${
                result.isCorrect ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {result.isCorrect ? "Correct!" : "Wrong!"}
            </h2>

            {!result.isCorrect && (
              <p className="text-sm text-gray-600 mt-1">
                Distance: {result.distanceKm.toLocaleString()} km
              </p>
            )}

            <p className="text-xs text-gray-500 mt-1">
              Correct: {result.correctCountries.map(countryName).join(", ")}
            </p>

            <div className="flex gap-4 mt-3 text-center">
              <div className="flex-1">
                <div className="text-xl font-bold text-emerald-700">
                  {result.score.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Distance Score</div>
              </div>
              <div className="flex-1">
                <div className="text-xl font-bold text-blue-600">
                  +{result.timeBonus.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Time Bonus</div>
              </div>
              {result.streakLength > 0 && (
                <div className="flex-1">
                  <div className="text-xl font-bold text-orange-500">
                    +{result.streakBonus.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    Streak x{result.streakLength}
                  </div>
                </div>
              )}
            </div>

            <div className="text-center mt-2 text-sm font-semibold">
              Total: {result.totalScore.toLocaleString()}
            </div>

            {(result.rangeDescription || result.funFact) && (
              <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-xs font-semibold text-amber-800 mb-1">
                  Did you know?
                </p>
                {result.rangeDescription && (
                  <p className="text-xs text-amber-900 leading-relaxed">
                    {result.rangeDescription}
                  </p>
                )}
                {result.funFact && (
                  <p className="text-xs text-amber-900 leading-relaxed mt-1 italic">
                    {result.funFact}
                  </p>
                )}
              </div>
            )}

            <div className="mt-3">
              <Button onClick={onNext} className="w-full">
                {result.gameFinished ? "See Results" : "Next Round"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
