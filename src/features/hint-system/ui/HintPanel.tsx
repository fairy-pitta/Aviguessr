type HintPanelProps = {
  hints: string[];
  loading: number | null;
  onReveal: (level: number) => void;
};

/** Cost per level, matching HINT_PENALTIES on the server. */
const HINT_LEVELS = [
  { label: "Which continents", cost: 15 },
  { label: "Which regions", cost: 30 },
];

export function HintPanel({ hints, loading, onReveal }: HintPanelProps) {
  return (
    <div className="glass rounded-xl p-4 w-72 animate-fade-up">
      <h3 className="text-sm font-semibold text-[var(--color-text-muted)] mb-3">
        Hints
      </h3>
      <ul className="flex flex-col gap-2">
        {HINT_LEVELS.map((level, i) => {
          const hint = hints[i];
          const isLoading = loading === i + 1;

          if (hint != null) {
            return (
              <li
                key={level.label}
                className="rounded-lg bg-teal-400/15 border border-teal-300/40 px-3 py-2"
              >
                <span className="text-sm font-medium text-[var(--color-text-strong)]">
                  {hint}
                </span>
              </li>
            );
          }

          return (
            <li key={level.label}>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => onReveal(i + 1)}
                className="w-full flex items-center justify-between gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-left hover:bg-white/10 hover:border-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 transition-colors disabled:opacity-60"
              >
                <span className="text-sm font-medium text-[var(--color-text-body)]">
                  {isLoading ? "Revealing" : level.label}
                </span>
                <span className="text-sm font-mono text-amber-200 tabular">
                  −{level.cost}%
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-sm text-[var(--color-text-muted)] leading-snug">
        A hint costs part of this round's score.
      </p>
    </div>
  );
}
