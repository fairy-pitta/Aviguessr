import { Button } from "@/shared/ui";

type StartButtonProps = {
  loading: boolean;
  onStart: () => void;
};

export function StartButton({ loading, onStart }: StartButtonProps) {
  return (
    <Button onClick={onStart} disabled={loading}>
      {loading ? "Loading..." : "Play"}
    </Button>
  );
}
