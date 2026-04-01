import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "relative font-display font-semibold rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 active:scale-[0.97] cursor-pointer select-none tracking-wide";

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const variants = {
    primary:
      "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:brightness-110",
    secondary:
      "glass text-slate-200 hover:bg-white/10 hover:border-white/15",
    danger:
      "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:brightness-110",
    ghost:
      "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5",
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
