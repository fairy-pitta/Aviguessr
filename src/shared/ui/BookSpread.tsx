import { useEffect, useRef, useState, type ReactNode } from "react";

/** How long the outgoing page stays visible beneath the lifting leaf. */
export const LIFT_MS = 170;
/** How long the whole turn takes, matching the leaf animation in CSS. */
export const TURN_MS = 760;

type Turn = {
  id: number;
  /** The page the leaf is covering as it comes down. */
  left: ReactNode;
  /** The outgoing right page, dropped once the leaf hides it. */
  right: ReactNode | null;
};

type BookSpreadProps = {
  left: ReactNode;
  right: ReactNode;
  /** Changing this turns the page. */
  turnKey: string | number;
};

function wantsMotion(): boolean {
  return !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/**
 * The open notebook every screen of the game is set in, and the leaf that
 * turns when the round advances.
 *
 * A real page carries its own front and back: the right page you are reading
 * swings over to become the next spread's left page. So the leaf's back is the
 * incoming left page, and it lands exactly on top of the page beneath it,
 * which lets it be removed without anything moving.
 *
 * The two halves swap at different moments on purpose. The right page is only
 * swapped once the leaf has lifted far enough to cover it, and the left page
 * not until the leaf has landed on it, so neither change is ever visible.
 */
export function BookSpread({ left, right, turnKey }: BookSpreadProps) {
  const [turn, setTurn] = useState<Turn | null>(null);
  const seenKey = useRef(turnKey);
  const previous = useRef<{ left: ReactNode; right: ReactNode }>({
    left,
    right,
  });
  const turns = useRef(0);

  // Adjusting state while rendering: React re-renders before painting, so the
  // outgoing page is never shown for a frame under the new key.
  if (seenKey.current !== turnKey) {
    seenKey.current = turnKey;
    if (wantsMotion()) {
      turns.current += 1;
      setTurn({
        id: turns.current,
        left: previous.current.left,
        right: previous.current.right,
      });
    }
  }
  previous.current = { left, right };

  const turnId = turn?.id;
  useEffect(() => {
    if (turnId === undefined) return;

    const lift = setTimeout(() => {
      setTurn((t) => (t && t.id === turnId ? { ...t, right: null } : t));
    }, LIFT_MS);
    const land = setTimeout(() => {
      setTurn((t) => (t && t.id === turnId ? null : t));
    }, TURN_MS);

    return () => {
      clearTimeout(lift);
      clearTimeout(land);
    };
  }, [turnId]);

  const leftPage = turn ? turn.left : left;
  const rightPage = turn && turn.right !== null ? turn.right : right;

  return (
    <div className="book">
      <div className="book__block">
        <div className="book__page book__page--left">{leftPage}</div>
        <div className="book__stitch" aria-hidden="true" />
        <div className="book__page book__page--right">{rightPage}</div>

        {turn && (
          <div
            key={turn.id}
            className="book__leaf"
            aria-hidden="true"
            style={{ animationDuration: `${TURN_MS}ms` }}
          >
            <div
              className="book__leaf-face book__leaf-face--front"
              style={{ animationDuration: `${LIFT_MS}ms` }}
            />
            <div className="book__leaf-face book__leaf-face--back">{left}</div>
          </div>
        )}
      </div>
    </div>
  );
}
