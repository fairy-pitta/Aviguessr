import { MAX_ROUNDS } from "@/shared/config/constants";

type ScorePanelProps = {
  currentRound: number;
  totalScore: number;
  currentStreak?: number;
};

export function ScorePanel({ currentRound, totalScore, currentStreak = 0 }: ScorePanelProps) {
  return (
    <div className="flex items-center gap-4 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow text-sm font-medium">
      <span>
        Round {currentRound}/{MAX_ROUNDS}
      </span>
      <span className="text-emerald-700">
        Score: {totalScore.toLocaleString()}
      </span>
      {currentStreak > 0 && (
        <span className="text-orange-500">
          Streak: {currentStreak}
        </span>
      )}
    </div>
  );
}
