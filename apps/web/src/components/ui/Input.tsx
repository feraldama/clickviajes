import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  /** Icono opcional a la izquierda (componente Lucide). */
  icon?: ReactNode;
}

/**
 * Campo con label visible (no placeholder-only) y error debajo del campo,
 * según las reglas de formularios del design system.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, icon, id, className = "", ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg">{icon}</span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={`w-full rounded-btn border bg-surface px-3 py-2.5 text-base text-foreground transition-colors duration-200 outline-none placeholder:text-muted-fg/70 focus:ring-2 focus:ring-ring/30 ${
            icon ? "pl-10" : ""
          } ${error ? "border-destructive focus:border-destructive" : "border-line focus:border-primary"} ${className}`}
          {...rest}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
});
