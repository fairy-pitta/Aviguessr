import { useMemo, useRef, useState } from "react";
import { COUNTRY_NAMES } from "../lib/countries";
import { matchCountries } from "../lib/countrySearch";

type CountrySearchProps = {
  selectedCountry: string | null;
  onCountrySelect: (code: string) => void;
};

/**
 * Pick a country by typing its name.
 *
 * Clicking the shape means zooming to it first, which is a fight on a phone
 * and hopeless at speed for Luxembourg or Singapore. The map stays — it is
 * the range map you are filling in — but it no longer has to be the only
 * way to answer.
 */
export function CountrySearch({
  selectedCountry,
  onCountrySelect,
}: CountrySearchProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const matches = useMemo(() => matchCountries(query, COUNTRY_NAMES), [query]);

  const choose = (code: string) => {
    onCountrySelect(code);
    setQuery("");
    setActive(0);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (matches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + matches.length) % matches.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(matches[Math.min(active, matches.length - 1)].code);
    } else if (e.key === "Escape") {
      setQuery("");
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={onKeyDown}
        placeholder={
          selectedCountry
            ? `${COUNTRY_NAMES[selectedCountry] ?? selectedCountry} — type to change`
            : "Type a country, or point at one on the map"
        }
        aria-label="Search for a country"
        autoComplete="off"
        className="w-full bg-transparent border-b border-[var(--color-paper-edge)] focus:border-[var(--color-ink)] outline-none py-2 text-base placeholder:text-[var(--color-ink-faint)]"
      />

      {matches.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-[700] bottom-full mb-1 w-full max-h-64 overflow-y-auto bg-[var(--color-paper)] border border-[var(--color-paper-edge)]"
        >
          {matches.map((m, i) => (
            <li key={m.code}>
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(m.code)}
                onMouseEnter={() => setActive(i)}
                className={`w-full text-left px-3 py-2 text-base cursor-pointer ${
                  i === active ? "bg-[var(--color-paper-deep)]" : ""
                }`}
              >
                {m.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
