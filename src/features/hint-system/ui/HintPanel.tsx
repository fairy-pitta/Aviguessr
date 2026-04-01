type HintPanelProps = {
  hints: string[];
  loading: boolean;
};

const HINT_LABELS = ["Continent (5s)", "Subregion (15s)", "Country (25s)"];

export function HintPanel({ hints, loading }: HintPanelProps) {
  return (
    <div className="bg-white/90 backdrop-blur rounded-lg shadow-md p-3 w-64">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Hints
      </h3>
      <div className="flex flex-col gap-1.5">
        {HINT_LABELS.map((label, i) => {
          const unlocked = hints[i] != null;
          return (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span
                className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  unlocked
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                {unlocked ? (
                  <span className="text-gray-800">{hints[i]}</span>
                ) : (
                  <span className="text-gray-400 italic">{label}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {loading && (
        <p className="text-xs text-gray-400 mt-1">Loading hint...</p>
      )}
    </div>
  );
}
