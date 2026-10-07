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
    <div className="min-w-0">
      <p className="text-base text-[var(--color-ink-soft)]">
        Plate{" "}
        <span className="font-semibold text-[var(--color-ink)] tabular">
          {currentRound}
        </span>{" "}
        of <span className="tabular">{MAX_ROUNDS}</span>
      </p>
      <p className="mt-1 flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-[var(--color-ink)] tabular leading-none">
          {totalScore.toLocaleString()}
        </span>
        {currentStreak > 0 && (
          <span className="text-sm text-[var(--color-range)] font-semibold">
            {currentStreak} in a row
          </span>
        )}
      </p>
    </div>
  );
}
