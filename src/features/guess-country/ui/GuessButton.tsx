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
  const countryDisplay = selectedCountry
    ? COUNTRY_NAMES[selectedCountry] || selectedCountry
    : null;

  return (
    <Button
      size="lg"
      disabled={!selectedCountry || loading}
      onClick={onGuess}
      className={selectedCountry ? "animate-pulse-glow" : ""}
    >
      {loading
        ? "Submitting..."
        : countryDisplay
          ? `Guess — ${countryDisplay}`
          : "Select a country on the map"}
    </Button>
  );
}
