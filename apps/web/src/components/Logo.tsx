import { Plane } from "lucide-react";

/** Logotipo de Click Viajes (icono + wordmark). */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-btn bg-primary text-white shadow-sm">
        <Plane className="h-5 w-5 -rotate-45" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="font-display text-xl leading-none text-foreground">
          Click <span className="text-accent">Viajes</span>
        </span>
      )}
    </span>
  );
}
