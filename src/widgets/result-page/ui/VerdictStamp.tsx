/**
 * The verdict, pressed onto the range map the moment the round resolves.
 *
 * The result used to arrive with nothing happening at all — the page simply
 * had different text on it — which is a thin reward for the one decision a
 * player makes in a round. A notebook gets marked, so this is a stamp.
 */
export function VerdictStamp({
  isCorrect,
  distanceKm,
}: {
  isCorrect: boolean;
  distanceKm: number;
}) {
  const colour = isCorrect ? "var(--color-range)" : "var(--color-miss)";

  return (
    <div
      aria-hidden="true"
      className="animate-stamp absolute left-1/2 top-1/2 z-[600] pointer-events-none select-none"
    >
      <div
        className="px-5 py-2.5 font-display font-semibold uppercase whitespace-nowrap text-lg lg:text-xl tracking-[0.18em]"
        style={{
          color: colour,
          border: `3px solid ${colour}`,
          outline: `1px solid ${colour}`,
          outlineOffset: "3px",
          backgroundColor: "rgba(237, 239, 234, 0.82)",
          opacity: 0.94,
        }}
      >
        {isCorrect
          ? "In range"
          : `${distanceKm.toLocaleString()} km out`}
      </div>
    </div>
  );
}
