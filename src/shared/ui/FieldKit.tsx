import { useId } from "react";

type FieldKitProps = {
  className?: string;
};

/** One barrel, eyecup at the left, flaring to the objective housing at the right. */
const BARREL =
  "M 22 30 L 34 30 C 40 30, 40 36, 46 36 L 104 36 C 110 36, 110 40, 116 40 L 130 40 C 136 40, 136 0, 130 0 L 116 0 C 110 0, 110 4, 104 4 L 46 4 C 40 4, 40 10, 34 10 L 22 10 C 16 10, 16 30, 22 30 Z";

/**
 * The title-page vignette: an open field notebook with the bird sketched on
 * the left page and its range hatched on the right, binoculars set down in
 * front of it.
 *
 * It is drawn rather than photographed because the drawing states the game's
 * premise in one look — the spread a guide gives you, arriving half finished.
 * The lines are clean geometry pushed through a turbulence displacement so
 * they wander the way a nib does; that filter is what makes this read as ink
 * on paper rather than as vector art.
 */
export function FieldKit({ className }: FieldKitProps) {
  const id = useId();
  const wobble = `${id}-wobble`;
  const rangeClip = `${id}-range`;
  const label = `${id}-label`;

  const leftPage =
    "M 40 50 C 100 34, 160 24, 203 20 C 204 62, 204 112, 203 153 C 158 158, 96 166, 28 172 C 30 142, 34 82, 40 50 Z";
  const rightPage =
    "M 207 20 C 250 24, 310 34, 370 50 C 376 82, 380 142, 382 172 C 314 166, 252 158, 207 153 C 206 112, 206 62, 207 20 Z";
  const range =
    "M 250 82 C 248 58, 272 40, 296 44 C 314 47, 322 60, 336 62 C 350 64, 348 86, 338 96 C 326 108, 300 118, 280 110 C 262 103, 252 98, 250 82 Z";

  return (
    <svg
      viewBox="10 6 400 292"
      role="img"
      aria-labelledby={label}
      className={className}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title id={label}>
        An open field notebook, a bird sketched on one page and its range
        hatched on the other, with binoculars set down in front of it
      </title>

      <defs>
        <filter id={wobble} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.016"
            numOctaves="3"
            seed="11"
            result="grain"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="grain"
            scale="3.8"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <clipPath id={rangeClip}>
          <path d={range} />
        </clipPath>
      </defs>

      <g filter={`url(#${wobble})`}>
        {/* Pages, filled so what is drawn on them stays on them */}
        <g fill="var(--color-paper)">
          <path d={leftPage} />
          <path d={rightPage} />
        </g>

        <g stroke="var(--color-ink)" strokeWidth="2.2">
          <path d={leftPage} />
          <path d={rightPage} />
          <path d="M 28 172 C 30 175, 29 177, 29 180 C 97 174, 159 166, 204 161" />
          <path d="M 382 172 C 382 175, 383 177, 383 180 C 314 174, 252 166, 206 161" />
        </g>

        {/* Sewn binding */}
        <g stroke="var(--color-ink-soft)" strokeWidth="1.7">
          <path d="M 199 32 L 210 30" />
          <path d="M 199 58 L 210 57" />
          <path d="M 199 84 L 210 84" />
          <path d="M 199 110 L 210 111" />
          <path d="M 199 136 L 210 138" />
        </g>

        {/* Left page: the bird, sketched the way you sketch in the field */}
        <g stroke="var(--color-ink-soft)" strokeWidth="1.9">
          <path d="M 92 118 C 82 108, 84 90, 98 82 C 112 74, 132 78, 140 91 C 145 100, 143 112, 134 118" />
          <path d="M 84 84 C 78 72, 86 63, 96 64 C 105 65, 109 74, 105 82" />
          <path d="M 83 77 L 67 82 L 84 86" />
          <path d="M 104 91 C 116 89, 130 95, 136 105" />
          <path d="M 141 92 C 156 88, 170 80, 180 70" />
          <path d="M 144 109 C 158 104, 172 92, 180 70" />
          <path d="M 106 119 L 105 130 L 97 133" />
          <path d="M 123 119 L 123 130 L 115 133" />
        </g>
        <circle cx="93" cy="74" r="2.1" fill="var(--color-ink)" stroke="none" />

        {/* Left page: jotted notes, too small to be words */}
        <g stroke="var(--color-ink-faint)" strokeWidth="1.5">
          <path d="M 54 146 C 68 145, 84 144, 100 143" />
          <path d="M 54 154 C 64 154, 76 152, 88 152" />
          <path d="M 55 162 C 67 162, 81 160, 95 159" />
        </g>

        {/* Right page: the range, hatched in the printing colour */}
        <g
          clipPath={`url(#${rangeClip})`}
          stroke="var(--color-range)"
          strokeWidth="1.4"
        >
          <path d="M 178 120 L 258 40" />
          <path d="M 192 120 L 272 40" />
          <path d="M 206 120 L 286 40" />
          <path d="M 220 120 L 300 40" />
          <path d="M 234 120 L 314 40" />
          <path d="M 248 120 L 328 40" />
          <path d="M 262 120 L 342 40" />
          <path d="M 276 120 L 356 40" />
        </g>
        <path d={range} stroke="var(--color-range)" strokeWidth="1.9" />

        {/*
          Binoculars set down in front of the notebook, seen from above. The
          barrels sit all but touching and flare at the objective end, which is
          what makes the instrument readable; no strap, since it drew as a
          loose wire and the shape does not need it.
        */}
        <g
          transform="translate(116 198) rotate(-12)"
          fill="var(--color-paper)"
          stroke="var(--color-ink)"
          strokeWidth="2.2"
        >
          <rect x="52" y="34" width="44" height="22" />
          <path d={BARREL} />
          <g transform="translate(0 48)">
            <path d={BARREL} />
          </g>

          <ellipse cx="126" cy="20" rx="5" ry="15" />
          <ellipse cx="126" cy="68" rx="5" ry="15" />

          <rect x="60" y="30" width="24" height="30" rx="5" />
          <g stroke="var(--color-ink-soft)" strokeWidth="1.4" fill="none">
            <path d="M 66 33 L 66 57" />
            <path d="M 72 32 L 72 58" />
            <path d="M 78 33 L 78 57" />
          </g>
        </g>
      </g>
    </svg>
  );
}
