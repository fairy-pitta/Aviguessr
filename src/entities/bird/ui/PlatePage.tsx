import type { ReactNode } from "react";
import type { Bird } from "../model/types";

type PlatePageProps = {
  bird: Bird;
  /**
   * The species account, shown only once the round is over. Common names
   * frequently name the place the bird lives, so nothing identifying appears
   * while the question is open.
   */
  account?: ReactNode;
};

/**
 * The left page of the spread: the photograph, edge to edge, captioned the way
 * a guide plate is.
 */
export function PlatePage({ bird, account }: PlatePageProps) {
  return (
    <figure className="relative h-full w-full m-0 bg-[var(--color-paper-deep)] overflow-hidden">
      <img
        src={bird.imageUrl}
        alt={account ? bird.name : "Bird to identify"}
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
            <p className="text-xl lg:text-2xl font-semibold leading-snug max-w-[22ch]">
              Where does this bird live?
            </p>
            {bird.habitat && (
              <p className="mt-2 text-base text-[#cfd6cc]">{bird.habitat}</p>
            )}
          </>
        )}
      </figcaption>
    </figure>
  );
}
