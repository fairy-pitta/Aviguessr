import { useNavigate } from "react-router-dom";
import { Button, HandRule, BookPage } from "@/shared/ui";

/**
 * A page the guide does not have.
 *
 * Without this the router matched nothing and rendered nothing, so any URL
 * the app did not know — a typo, or a link to a page a deploy has not caught
 * up with yet — was a white screen with no way back and nothing to say what
 * had happened.
 */
export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <BookPage>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-semibold tracking-tight leading-tight">
            There is no such page in this guide
          </h1>
          <p className="mt-3 text-lg text-[var(--color-ink-soft)] max-w-[34ch]">
            The address may be mistyped, or it may be a page this copy of the
            guide was printed too early to have.
          </p>
          <div className="mt-6">
            <HandRule />
          </div>
          <div className="mt-6 flex items-center gap-4">
            <Button onClick={() => navigate("/")}>Back to the guide</Button>
            <Button variant="ghost" onClick={() => navigate("/list")}>
              Your life list
            </Button>
          </div>
        </div>
      </div>
    </BookPage>
  );
}
