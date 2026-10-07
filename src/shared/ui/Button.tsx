import type { ButtonHTMLAttributes, ReactNode } from "react";
import { InkFrame } from "./InkFrame";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
};

/**
 * Ink on paper. The primary action is a box inked in solid, the secondary is
 * the same box left as an outline, and both are drawn rather than bordered —
 * the page is structured by pen strokes, not by raised surfaces.
 */
export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "relative font-display font-semibold transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer select-none";

  const sizes = {
    sm: "px-3.5 py-2 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-6 py-3.5 text-lg",
  };

  const text = {
    primary: "text-[var(--color-paper)]",
    secondary: "text-[var(--color-ink)]",
    ghost:
      "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] underline decoration-[var(--color-paper-edge)] underline-offset-4 hover:decoration-[var(--color-ink)]",
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${text[variant]} ${className}`}
      {...props}
    >
      {variant !== "ghost" && <InkFrame solid={variant === "primary"} />}
      <span className="relative">{children}</span>
    </button>
  );
}
