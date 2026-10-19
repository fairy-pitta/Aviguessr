import { useState } from "react";
import { Button, HandRule } from "@/shared/ui";
import { issueRecoveryCode, restoreFromCode } from "@/entities/player";

/**
 * Carrying a list to another device, in both directions.
 *
 * There is no account and no password, so the code is the whole of it: the
 * server keeps only a hash and shows the code once. Saying so plainly is
 * part of the feature — a player who loses it has lost the only key.
 */
export function RecoveryCode({
  hasCode,
  onRestored,
}: {
  hasCode: boolean;
  onRestored: () => void;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [entered, setEntered] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const mint = async () => {
    setBusy(true);
    setError(null);
    try {
      setCode((await issueRecoveryCode()).code);
    } catch {
      setError("Could not make a code. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    setBusy(true);
    setError(null);
    try {
      await restoreFromCode(entered);
      onRestored();
    } catch {
      setError("That code does not match a list.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold pb-1.5">Taking the list with you</h2>
      <HandRule />

      {code ? (
        <div className="py-4">
          <p className="handwritten text-3xl tracking-wide">{code}</p>
          <p className="mt-2 text-base text-[var(--color-ink-soft)] max-w-[44ch]">
            Write it down. It is shown this once and nowhere else, and it is
            the only way back to this list from another device.
          </p>
        </div>
      ) : (
        <div className="py-4">
          <p className="text-base text-[var(--color-ink-soft)] max-w-[46ch]">
            {hasCode
              ? "You already have a code. Making a new one replaces it."
              : "A code moves this list to another browser or device. There is no account behind it, so the code is the only key."}
          </p>
          <div className="mt-3">
            <Button variant="secondary" disabled={busy} onClick={mint}>
              {hasCode ? "Make a new code" : "Make a code"}
            </Button>
          </div>
        </div>
      )}

      <HandRule />
      <div className="py-4">
        <label
          htmlFor="recovery-code"
          className="block text-base text-[var(--color-ink-soft)]"
        >
          Already have a code?
        </label>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            id="recovery-code"
            value={entered}
            onChange={(e) => setEntered(e.target.value)}
            placeholder="XXXX-XXXX-XXXX"
            autoComplete="off"
            spellCheck={false}
            className="handwritten text-xl bg-transparent outline-none w-[13ch] border-b-2 border-[var(--color-paper-edge)] focus:border-[var(--color-ink)]"
          />
          <Button
            variant="secondary"
            size="sm"
            disabled={busy || entered.trim() === ""}
            onClick={restore}
          >
            Bring that list here
          </Button>
        </div>
        {error && (
          <p className="mt-2 text-base" style={{ color: "var(--color-miss)" }}>
            {error}
          </p>
        )}
      </div>
      <HandRule />
    </section>
  );
}
