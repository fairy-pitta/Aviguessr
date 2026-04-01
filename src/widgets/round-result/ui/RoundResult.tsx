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

      {/* Result panel — right side, same position as BirdCard */}
      <div className="absolute top-4 right-4 z-10 w-72 animate-slide-in-right">
        <div
          className={`glass rounded-xl overflow-hidden ${
            result.isCorrect ? "glow-accent" : "glow-hot"
          }`}
        >
          {/* Bird image with result overlay */}
          <div className="relative">
            <img
              src={bird.imageUrl}
              alt={bird.name}
              className="w-full h-44 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-transparent to-transparent" />

            {/* Result badge */}
            <div
              className={`absolute bottom-3 left-3 px-3 py-1 rounded-lg text-sm font-black tracking-wide ${
                result.isCorrect
                  ? "bg-teal-500/90 text-white animate-score-pop"
                  : "bg-rose-500/90 text-white animate-shake"
              }`}
            >
              {result.isCorrect ? "CORRECT" : "WRONG"}
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-bold text-white text-sm">{bird.name}</h3>

            {!result.isCorrect && (
              <p className="text-xs text-slate-400 mt-1">
                {result.distanceKm.toLocaleString()} km away
              </p>
            )}

            <p className="text-[11px] text-slate-500 mt-1">
              {result.correctCountries.map(countryName).join(", ")}
            </p>

            {/* Score breakdown */}
            <div className="flex gap-2 mt-3 text-center stagger">
              <div className="flex-1 glass rounded-lg p-2 animate-fade-up">
                <div className="font-mono font-bold text-base text-teal-300">
                  {result.score.toLocaleString()}
                </div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider">
                  Distance
                </div>
              </div>
              <div className="flex-1 glass rounded-lg p-2 animate-fade-up">
                <div className="font-mono font-bold text-base text-cyan-300">
                  +{result.timeBonus.toLocaleString()}
                </div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider">
                  Time
                </div>
              </div>
              {result.streakLength > 0 && (
                <div className="flex-1 glass rounded-lg p-2 animate-fade-up">
                  <div className="font-mono font-bold text-base text-streak animate-streak-fire">
                    +{result.streakBonus.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider">
                    x{result.streakLength}
                  </div>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="text-center mt-3">
              <span className="font-mono font-bold text-lg text-white animate-score-pop inline-block">
                {result.totalScore.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 ml-1">total</span>
            </div>

            {/* Learning section */}
            {(result.rangeDescription || result.funFact) && (
              <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                  Did you know?
                </p>
                {result.rangeDescription && (
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {result.rangeDescription}
                  </p>
                )}
                {result.funFact && (
                  <p className="text-xs text-slate-400 leading-relaxed mt-1 italic">
                    {result.funFact}
                  </p>
                )}
              </div>
            )}

            <div className="mt-3">
              <Button onClick={onNext} className="w-full" size="md">
                {result.gameFinished ? "See Results" : "Next Round →"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
