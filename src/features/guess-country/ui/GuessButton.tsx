import { Button } from "@/shared/ui";
import { COUNTRY_NAMES } from "@/entities/country";

type GuessButtonProps = {
  selectedCountry: string | null;
  loading: boolean;
  onGuess: () => void;
};

export function GuessButton({
  selectedCountry,
  loading,
  onGuess,
}: GuessButtonProps) {
  const countryName = selectedCountry
    ? (COUNTRY_NAMES[selectedCountry] ?? selectedCountry)
    : null;

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-base text-[var(--color-ink-soft)] min-w-0">
        {countryName ? (
          <>
            Your answer:{" "}
            <span className="handwritten text-2xl text-[var(--color-ink)] leading-none">
              {countryName}
            </span>
          </>
        ) : (
          "Pick a country on the map"
        )}
      </p>
      <Button
        size="md"
        disabled={!selectedCountry || loading}
        onClick={onGuess}
        className="shrink-0"
      >
        {loading ? "Submitting" : "Submit answer"}
      </Button>
    </div>
  );
}
