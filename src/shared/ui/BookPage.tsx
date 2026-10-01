import type { ReactNode } from "react";

/**
 * A single leaf of the same notebook, for the screens that are not a spread —
 * the title page, the results, the day's page. It keeps those screens on the
 * same desk and the same stock as the game.
 */
export function BookPage({ children }: { children: ReactNode }) {
  return (
    <div className="book">
      <div className="book__block book__block--single">{children}</div>
    </div>
  );
}
