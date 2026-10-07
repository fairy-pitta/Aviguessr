/**
 * The pen and the inks, defined once for the whole app.
 *
 * Every drawn edge in the interface — panel frames, rules, the coastlines on
 * the map — is clean geometry referencing `#ink-edge`, a turbulence
 * displacement that makes a straight line wander the way a nib does. Keeping
 * one filter in one place means the whole app is drawn with the same pen.
 *
 * The hatch patterns are paint servers for the map. A country the player has
 * marked is hatched rather than flooded, because that is how you fill a region
 * in by hand.
 */
export function InkDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        {/* Interface edges, in CSS pixel space */}
        <filter id="ink-edge" x="-12%" y="-12%" width="124%" height="124%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.021"
            numOctaves="3"
            seed="7"
            result="grain"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="grain"
            scale="2.4"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/*
          Rules and bars. A filter region is a percentage of the bounding box,
          and a horizontal line's box is zero pixels tall — the region collapses
          and the element is dropped entirely. So rules are drawn as thin rects,
          which have a real box, and these two filters give that box enough room
          either side to wander in.
        */}
        <filter id="ink-stroke" x="-2%" y="-400%" width="104%" height="900%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.021"
            numOctaves="3"
            seed="7"
            result="grain"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="grain"
            scale="2.6"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter id="ink-stroke-2" x="-2%" y="-400%" width="104%" height="900%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.021"
            numOctaves="3"
            seed="29"
            result="grain"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="grain"
            scale="2.6"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter id="ink-stroke-3" x="-2%" y="-400%" width="104%" height="900%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.021"
            numOctaves="3"
            seed="47"
            result="grain"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="grain"
            scale="2.6"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter id="ink-stroke-v" x="-400%" y="-2%" width="900%" height="104%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.021"
            numOctaves="3"
            seed="13"
            result="grain"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="grain"
            scale="2.6"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* A sewn binding, for the gutter between the two pages */}
        <pattern
          id="stitch-v"
          width="4"
          height="15"
          patternUnits="userSpaceOnUse"
        >
          <rect width="4" height="8" fill="#7b8a85" />
        </pattern>

        {/* Coastlines are already irregular, so they need a lighter hand */}
        <filter id="ink-coast" x="-4%" y="-4%" width="108%" height="108%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.03"
            numOctaves="2"
            seed="3"
            result="grain"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="grain"
            scale="1.4"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Hatches: the paper shows through between the strokes */}
        <pattern
          id="hatch-ink"
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="7" height="7" fill="#e1e5dd" />
          <line x1="0" y1="0" x2="0" y2="7" stroke="#1b2a28" strokeWidth="2.4" />
        </pattern>
        <pattern
          id="hatch-range"
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="7" height="7" fill="#e1e5dd" />
          <line x1="0" y1="0" x2="0" y2="7" stroke="#5e7a2e" strokeWidth="2.6" />
        </pattern>
        <pattern
          id="hatch-miss"
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-45)"
        >
          <rect width="7" height="7" fill="#e1e5dd" />
          <line x1="0" y1="0" x2="0" y2="7" stroke="#7d3b4f" strokeWidth="2.6" />
        </pattern>
      </defs>
    </svg>
  );
}
