import { useId } from "react";

type HandRuleProps = {
  className?: string;
  tone?: "edge" | "ink" | "soft";
  /** Vertical rules carry the gutter between the two pages. */
  vertical?: boolean;
  /** Stitched reads as a sewn binding rather than a printed rule. */
  stitched?: boolean;
};

/**
 * A ruled line drawn rather than bordered, so the app is divided by pen
 * strokes instead of by CSS borders.
 *
 * It is a thin rect and not a line on purpose: a horizontal line's bounding
 * box is zero pixels tall, the filter region is a percentage of that box, and
 * an element with no filter region is not drawn at all. A rect has a real box.
 */
export function HandRule({
  className = "",
  tone = "edge",
  vertical = false,
  stitched = false,
}: HandRuleProps) {
  // Rules of the same width share one filter, so a stack of them wobbles in
  // lockstep and reads as a repeating pattern. Three pens, chosen per instance.
  const id = useId();
  const pen = (id.length + id.charCodeAt(id.length - 2)) % 3;
  const horizontal = pen === 0 ? "ink-stroke" : `ink-stroke-${pen + 1}`;

  const ink =
    tone === "ink"
      ? "var(--color-ink)"
      : tone === "soft"
        ? "var(--color-ink-faint)"
        : "var(--color-rule)";
  const thickness = tone === "edge" ? 1.6 : 2;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={`block shrink-0 ${
        vertical ? "h-full w-[10px]" : "w-full h-[10px]"
      } ${className}`}
    >
      <rect
        x={vertical ? 4 : 0}
        y={vertical ? 0 : 4}
        width={vertical ? thickness : "100%"}
        height={vertical ? "100%" : thickness}
        fill={stitched ? "url(#stitch-v)" : ink}
        filter={vertical ? "url(#ink-stroke-v)" : `url(#${horizontal})`}
      />
    </svg>
  );
}
