import type { ReactNode } from "react";
import type { Bird } from "../model/types";

/** One hand-drawn photo corner; the same L, turned for each corner. */
function Corner({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="30"
      height="30"
      className={`absolute ${className}`}
    >
      <path
        d="M 3 26 L 3 3 L 26 3"
        fill="none"
        stroke="var(--color-ink-soft)"
        strokeWidth="2"
        strokeLinecap="round"
        filter="url(#ink-edge)"
      />
    </svg>
  );
}

type PlatePageProps = {
  bird: Bird;
  /**
   * The species account, shown only once the round is over. The name is on
   * the plate from the start — it is what separates two species a photograph
   * cannot — but the family, the range and the fact wait for the answer.
   */
  account?: ReactNode;
};

/**
 * The left page of the spread: the photograph pasted onto the page, held at
 * the corners the way a print is mounted in a notebook.
 */
export function PlatePage({ bird, account }: PlatePageProps) {
  return (
    <div className="relative h-full w-full p-3 lg:p-5">
      <figure className="relative h-full w-full m-0 bg-[var(--color-paper-deep)] overflow-hidden">
        <img
          src={bird.imageUrl}
          alt={bird.name}
          className="h-full w-full object-cover"
        />

        <div
          className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(12,20,19,0.88), rgba(12,20,19,0.4) 50%, transparent)",
          }}
        />

        <figcaption className="absolute inset-x-0 bottom-0 p-5 lg:p-8 text-[#edefea]">
          {account ?? (
            <>
              <h2 className="text-2xl lg:text-3xl font-semibold leading-tight">
                {bird.name}
              </h2>
              <p className="mt-2 text-base lg:text-lg text-[#cfd6cc]">
                Where does this bird live?
              </p>
              {bird.habitat && (
                <p className="mt-1 text-base text-[#cfd6cc]">{bird.habitat}</p>
              )}
            </>
          )}
        </figcaption>
      </figure>

      <Corner className="top-0 left-0" />
      <Corner className="top-0 right-0 rotate-90" />
      <Corner className="bottom-0 right-0 rotate-180" />
      <Corner className="bottom-0 left-0 -rotate-90" />
    </div>
  );
}
