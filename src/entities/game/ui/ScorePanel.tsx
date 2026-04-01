import { MAX_ROUNDS } from "@/shared/config/constants";

type ScorePanelProps = {
  currentRound: number;
  totalScore: number;
  currentStreak?: number;
};

export function ScorePanel({ currentRound, totalScore, currentStreak = 0 }: ScorePanelProps) {
  return (
    <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-5 text-sm">
      {/* Round indicator */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: MAX_ROUNDS }, (_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i < currentRound - 1
                ? "bg-teal-400"
                : i === currentRound - 1
                  ? "bg-teal-400 animate-pulse-glow"
                  : "bg-white/10"
            }`}
          />
        ))}
        <span className="ml-1.5 text-slate-400 font-mono text-xs">
          {currentRound}/{MAX_ROUNDS}
        </span>
      </div>

      {/* Score */}
      <div className="flex items-baseline gap-1">
        <span className="font-mono font-bold text-base text-white tracking-tight">
          {totalScore.toLocaleString()}
        </span>
        <span className="text-xs text-slate-500">pts</span>
      </div>

      {/* Streak */}
      {currentStreak > 0 && (
        <div className="flex items-center gap-1 animate-streak-fire">
          <span className="text-streak font-bold text-sm">
            {currentStreak}x
          </span>
        </div>
      )}
    </div>
  );
}
