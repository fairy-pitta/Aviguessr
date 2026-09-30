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
    <div className="bg-[var(--color-paper)]/95 backdrop-blur-sm border rule rounded p-3.5">
      <ul className="flex flex-col gap-2">
        {HINT_LEVELS.map((level, i) => {
          const hint = hints[i];
          const isLoading = loading === i + 1;

          if (hint != null) {
            return (
              <li
                key={level.label}
                className="border-l-2 pl-2.5"
                style={{ borderColor: "var(--color-range)" }}
              >
                <span className="text-sm font-medium text-[var(--color-ink)]">
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
                className="w-full flex items-baseline justify-between gap-3 text-left border-b rule pb-1.5 hover:border-[var(--color-ink)] transition-colors disabled:opacity-50"
              >
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  {isLoading ? "Revealing" : level.label}
                </span>
                <span className="text-sm text-[var(--color-ink-soft)] tabular shrink-0">
                  costs {level.cost}%
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
