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

function getGrade(percentage: number): { label: string; color: string } {
  if (percentage >= 90) return { label: "S", color: "text-gradient-gold" };
  if (percentage >= 75) return { label: "A", color: "text-gradient-accent" };
  if (percentage >= 60) return { label: "B", color: "text-teal-400" };
  if (percentage >= 40) return { label: "C", color: "text-amber-400" };
  return { label: "D", color: "text-slate-400" };
}

export function GameSummary({
  rounds,
  totalScore,
  onPlayAgain,
}: GameSummaryProps) {
  const maxPossible = MAX_ROUNDS * (MAX_SCORE_PER_ROUND + 1000);
  const percentage = Math.round((totalScore / maxPossible) * 100);
  const grade = getGrade(percentage);

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-[120px]" />

      <div className="glass rounded-2xl p-8 max-w-lg w-full relative animate-fade-up">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-sm font-mono font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">
            Game Complete
          </h1>

          {/* Grade + Score */}
          <div className="flex items-center justify-center gap-4 mb-2">
            <span className={`text-6xl font-black ${grade.color}`}>
              {grade.label}
            </span>
            <div className="text-left">
              <div className="font-mono font-bold text-3xl text-white animate-score-pop">
                {totalScore.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">
                / {maxPossible.toLocaleString()} ({percentage}%)
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-4">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all duration-1000"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Round breakdown */}
        <div className="space-y-2 mb-8 stagger">
          {rounds.map((round) => (
            <div
              key={round.round}
              className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/5 hover:bg-white/5 transition-colors animate-fade-up"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    round.result?.isCorrect
                      ? "bg-teal-500/20 text-teal-300"
                      : "bg-rose-500/20 text-rose-300"
                  }`}
                >
                  {round.round}
                </div>
                <span className="font-medium text-sm text-slate-200">
                  {round.bird.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {round.result && (
                  <>
                    <span className="text-xs text-slate-500">
                      {countryName(round.result.guessedCountry)}
                    </span>
                    <span
                      className={`font-mono font-bold text-sm ${
                        round.result.isCorrect
                          ? "text-teal-300"
                          : "text-rose-400"
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

        {/* Action */}
        <div className="text-center">
          <Button onClick={onPlayAgain} size="lg" className="w-full">
            Play Again
          </Button>
        </div>
      </div>
    </div>
  );
}
