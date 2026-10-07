import { useLayoutEffect, useRef, useState } from "react";

type InkFrameProps = {
  /** Filled with ink, for the one action that carries the page. */
  solid?: boolean;
  tone?: "ink" | "edge";
};

/**
 * A drawn frame that fills whatever positioned element it is dropped into.
 *
 * The frame is measured rather than scaled: a stretched viewBox would stretch
 * the wobble with it, so a wide panel would wander differently from a narrow
 * one and the app would look drawn by two different hands. Measuring keeps
 * every stroke in CSS pixel space, which is the space `#ink-edge` is tuned for.
 */
export function InkFrame({ solid = false, tone = "edge" }: InkFrameProps) {
  const ref = useRef<SVGSVGElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;

    const measure = () => setBox({ w: parent.offsetWidth, h: parent.offsetHeight });
    measure();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  const { w, h } = box;
  // Corners overshoot by a pixel, the way a pen does when you do not lift it
  const frame =
    w > 4 && h > 4
      ? `M 2.5 3.5 L ${w - 2.5} 2 L ${w - 2} ${h - 2.5} L 3 ${h - 1.5} Z`
      : null;

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      focusable="false"
      className="absolute inset-0 h-full w-full overflow-visible pointer-events-none"
    >
      {frame && (
        <path
          d={frame}
          fill={solid ? "var(--color-ink)" : "none"}
          stroke={
            solid
              ? "var(--color-ink)"
              : tone === "ink"
                ? "var(--color-ink)"
                : "var(--color-paper-edge)"
          }
          strokeWidth={solid ? 2 : 1.4}
          strokeLinejoin="round"
          filter="url(#ink-edge)"
        />
      )}
    </svg>
  );
}
