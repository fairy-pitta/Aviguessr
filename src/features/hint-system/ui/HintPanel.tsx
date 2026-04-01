type HintPanelProps = {
  hints: string[];
  loading: boolean;
};

const HINT_LEVELS = [
  { label: "Continent", time: "5s" },
  { label: "Region", time: "15s" },
  { label: "Country", time: "25s" },
];

export function HintPanel({ hints, loading }: HintPanelProps) {
  return (
    <div className="glass rounded-xl p-3 w-64 animate-fade-up">
      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2">
        Hints
      </h3>
      <div className="flex flex-col gap-2">
        {HINT_LEVELS.map((level, i) => {
          const unlocked = hints[i] != null;
          return (
            <div
              key={i}
              className={`flex items-center gap-2 text-sm transition-opacity duration-300 ${
                unlocked ? "" : "opacity-40"
              }`}
            >
              <span
                className={`w-6 h-6 flex-shrink-0 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                  unlocked
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                    : "bg-white/5 text-slate-600 border border-white/5"
                }`}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                {unlocked ? (
                  <span className="text-white font-medium text-sm">
                    {hints[i]}
                  </span>
                ) : (
                  <span className="text-slate-500 text-xs">
                    {level.label} — {level.time}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {loading && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-[10px] text-slate-500">Loading...</span>
        </div>
      )}
    </div>
  );
}
