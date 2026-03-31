import { Button } from "@/shared/ui";

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
  return (
    <Button
      disabled={!selectedCountry || loading}
      onClick={onGuess}
    >
      {loading ? "Submitting..." : selectedCountry ? `Guess: ${selectedCountry}` : "Select a country"}
    </Button>
  );
}
