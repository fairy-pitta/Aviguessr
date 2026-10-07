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

/**
 * A strip in the margin rather than a panel over the map — a hint that named
 * South America used to sit on top of South America.
 *
 * An unbought hint is printed as an offer. Once bought it becomes a note the
 * player wrote themselves, so it switches to the hand.
 */
export function HintPanel({ hints, loading, onReveal }: HintPanelProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-7 gap-y-2">
      {HINT_LEVELS.map((level, i) => {
        const hint = hints[i];
        const isLoading = loading === i + 1;

        if (hint != null) {
          return (
            <p key={level.label} className="relative pl-4">
              <svg
                aria-hidden="true"
                focusable="false"
                className="absolute inset-y-0 left-0 w-[10px] h-full"
              >
                <rect
                  x="4"
                  y="0"
                  width="2"
                  height="100%"
                  fill="var(--color-range)"
                  filter="url(#ink-stroke-v)"
                />
              </svg>
              <span className="handwritten text-lg leading-snug text-[var(--color-ink)]">
                {hint}
              </span>
            </p>
          );
        }

        return (
          <button
            key={level.label}
            type="button"
            disabled={isLoading}
            onClick={() => onReveal(i + 1)}
            className="group text-left disabled:opacity-50"
          >
            <span className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-[var(--color-ink)]">
                {isLoading ? "Revealing" : level.label}
              </span>
              <span className="text-sm text-[var(--color-ink-soft)] tabular">
                costs {level.cost}%
              </span>
            </span>
            <span
              aria-hidden="true"
              className="block mt-0.5 h-[2px] bg-[var(--color-paper-edge)] group-hover:bg-[var(--color-ink)] transition-colors"
            />
          </button>
        );
      })}
    </div>
  );
}
