type HintPanelProps = {
  hints: string[];
  loading: boolean;
};

const HINT_LEVELS = [
  { label: "Continent", unlocksAt: "5s" },
  { label: "Region", unlocksAt: "15s" },
  { label: "Country", unlocksAt: "25s" },
];

export function HintPanel({ hints, loading }: HintPanelProps) {
  return (
    <div className="glass rounded-xl p-4 w-72 animate-fade-up">
      <h3 className="text-sm font-semibold text-[var(--color-text-muted)] mb-3">
        Hints
      </h3>
      <ul className="flex flex-col gap-2.5">
        {HINT_LEVELS.map((level, i) => {
          const hint = hints[i];
          const unlocked = hint != null;
          return (
            <li key={level.label} className="flex items-start gap-2.5">
              <span
                className={`w-6 h-6 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-bold ${
                  unlocked
                    ? "bg-teal-400/25 text-teal-100 border border-teal-300/50"
                    : "bg-white/10 text-[var(--color-text-muted)] border border-white/15"
                }`}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 pt-0.5">
                {unlocked ? (
                  <span className="text-sm font-medium text-[var(--color-text-strong)]">
                    {hint}
                  </span>
                ) : (
                  <span className="text-sm text-[var(--color-text-muted)]">
                    {level.label}, unlocks at {level.unlocksAt}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      {loading && (
        <p className="mt-3 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <span
            className="w-2 h-2 rounded-full bg-teal-300 animate-pulse"
            aria-hidden="true"
          />
          Loading
        </p>
      )}
    </div>
  );
}
