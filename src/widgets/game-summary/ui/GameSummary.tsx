import { COUNTRY_NAMES } from "@/entities/country";
import { Button } from "@/shared/ui";
import type { GameRound } from "@/entities/game";
import { MAX_ROUNDS, MAX_SCORE_PER_ROUND } from "@/shared/config/constants";

type GameSummaryProps = {
  rounds: GameRound[];
  totalScore: number;
  onPlayAgain: () => void;
};

function countryName(code: string): string {
  return COUNTRY_NAMES[code] || code;
}

export function GameSummary({
  rounds,
  totalScore,
  onPlayAgain,
}: GameSummaryProps) {
  const maxPossible = MAX_ROUNDS * (MAX_SCORE_PER_ROUND + 1000);
  const percentage = Math.round((totalScore / maxPossible) * 100);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
        <h1 className="text-3xl font-bold text-center mb-2">Game Over</h1>
        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-emerald-600">
            {totalScore.toLocaleString()}
          </div>
          <div className="text-gray-500">
            / {maxPossible.toLocaleString()} ({percentage}%)
          </div>
        </div>

        <div className="space-y-3 mb-8">
          {rounds.map((round) => (
            <div
              key={round.round}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-400">
                  R{round.round}
                </span>
                <span className="font-medium">{round.bird.name}</span>
              </div>
              <div className="flex items-center gap-3">
                {round.result && (
                  <>
                    <span className="text-sm text-gray-500">
                      {countryName(round.result.guessedCountry)}
                    </span>
                    <span
                      className={`font-semibold ${
                        round.result.isCorrect
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {round.result.score.toLocaleString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button onClick={onPlayAgain}>Play Again</Button>
        </div>
      </div>
    </div>
  );
}
