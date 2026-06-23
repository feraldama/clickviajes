import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-btn px-5 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  // CTA en naranja aventura (accent), según MASTER.
  primary: "bg-accent text-white shadow-md hover:bg-accent-hover hover:shadow-lg",
  secondary: "border-2 border-primary text-primary hover:bg-primary/5",
  ghost: "text-foreground hover:bg-muted",
};

export function Button({ variant = "primary", loading, children, className = "", disabled, ...rest }: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={disabled || loading} {...rest}>
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
