import { MAX_ROUNDS } from "@/shared/config/constants";

type ScorePanelProps = {
  currentRound: number;
  totalScore: number;
  currentStreak?: number;
};

export function ScorePanel({
  currentRound,
  totalScore,
  currentStreak = 0,
}: ScorePanelProps) {
  return (
    <div className="flex items-center gap-5">
      <div className="flex items-center gap-2">
        <span className="font-mono font-bold text-base text-[var(--color-text-body)] tabular">
          {currentRound}/{MAX_ROUNDS}
        </span>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {Array.from({ length: MAX_ROUNDS }, (_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i < currentRound - 1
                  ? "bg-teal-300"
                  : i === currentRound - 1
                    ? "bg-teal-300 animate-pulse-glow"
                    : "bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="font-mono font-bold text-xl text-[var(--color-text-strong)] tabular">
          {totalScore.toLocaleString()}
        </span>
        <span className="text-sm text-[var(--color-text-muted)]">points</span>
      </div>

      {currentStreak > 0 && (
        <span className="text-[var(--color-streak)] font-bold text-base animate-streak-fire">
          {currentStreak}x streak
        </span>
      )}
    </div>
  );
}
