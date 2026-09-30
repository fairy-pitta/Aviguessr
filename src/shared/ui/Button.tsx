import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
};

/**
 * Ink on paper. The primary action is solid ink, the secondary is an outline,
 * and neither carries a gradient or a shadow — the page is structured by rules
 * and weight, not by raised surfaces.
 */
export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "font-display font-semibold rounded transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer select-none";

  const sizes = {
    sm: "px-3.5 py-2 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-6 py-3.5 text-lg",
  };

  const variants = {
    primary:
      "bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-[#27403c] disabled:hover:bg-[var(--color-ink)]",
    secondary:
      "bg-transparent text-[var(--color-ink)] border border-[var(--color-paper-edge)] hover:border-[var(--color-ink)]",
    ghost:
      "bg-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] underline decoration-[var(--color-paper-edge)] underline-offset-4 hover:decoration-[var(--color-ink)]",
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
