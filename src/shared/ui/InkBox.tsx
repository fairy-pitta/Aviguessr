import type { ReactNode } from "react";
import { InkFrame } from "./InkFrame";

type InkBoxProps = {
  children: ReactNode;
  solid?: boolean;
  tone?: "ink" | "edge";
  className?: string;
};

/** Content with a drawn frame around it instead of a CSS border. */
export function InkBox({
  children,
  solid = false,
  tone = "edge",
  className = "",
}: InkBoxProps) {
  return (
    <div className={`relative ${className}`}>
      <InkFrame solid={solid} tone={tone} />
      <div className="relative">{children}</div>
    </div>
  );
}
