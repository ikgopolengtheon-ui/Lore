import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium " +
  "px-5 py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed " +
  "focus-visible:outline focus-visible:outline-3 focus-visible:outline-amber";

const variants: Record<Variant, string> = {
  // Void text on Amber — the one accessible combo (PRD §12.5); never white on amber.
  primary: "bg-amber text-void hover:bg-amber-lt",
  secondary: "border border-line-m text-cream hover:border-amber/60 bg-transparent",
  ghost: "text-dusk hover:text-cream bg-transparent",
};

export function Button({ variant = "primary", className = "", ...rest }: Props) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest} />
  );
}
