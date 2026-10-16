type HintPanelProps = {
  hints: string[];
  /**
   * What each level costs this round, as a fraction.
   *
   * The family hint is priced by how much the family narrows the world, so
   * it is not a constant the client can hold: "Hawks and Eagles" is worth
   * far less than a family confined to one island. The server sends the
   * prices with the round, before the player commits to any of them.
   */
  costs: number[];
  loading: number | null;
  onReveal: (level: number) => void;
};

const HINT_LABELS = ["Which continents", "Which family"];

/** The prices the server quotes before any of them has arrived. */
const FALLBACK_COSTS = [0.15, 0.3];

/**
 * A strip in the margin rather than a panel over the map — a hint that named
 * South America used to sit on top of South America.
 *
 * An unbought hint is printed as an offer. Once bought it becomes a note the
 * player wrote themselves, so it switches to the hand.
 */
export function HintPanel({ hints, costs, loading, onReveal }: HintPanelProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-7 gap-y-2">
      {HINT_LABELS.map((label, i) => {
        const hint = hints[i];
        const isLoading = loading === i + 1;
        const cost = Math.round((costs[i] ?? FALLBACK_COSTS[i]) * 100);

        if (hint != null) {
          return (
            <p key={label} className="relative pl-4">
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
            key={label}
            type="button"
            disabled={isLoading}
            onClick={() => onReveal(i + 1)}
            className="group text-left disabled:opacity-50"
          >
            <span className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-[var(--color-ink)]">
                {isLoading ? "Revealing" : label}
              </span>
              <span className="text-sm text-[var(--color-ink-soft)] tabular">
                costs {cost}%
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
