import { AlertTriangle } from "lucide-react";
import { formatMoney, type Currency } from "@clickviajes/shared";

/** Muestra el margen (monto + %) en color según signo, con aviso si faltan tasas. */
export function MarginValue({
  margin,
  pct,
  base,
  incomplete,
}: {
  margin: number | null;
  pct: number | null;
  base: Currency;
  incomplete: boolean;
}) {
  if (margin === null) {
    return <p className="mt-0.5 text-xs text-muted-fg">Sin datos</p>;
  }
  const positive = margin >= 0;
  return (
    <p className={`mt-0.5 inline-flex items-center gap-1 font-mono font-semibold ${positive ? "text-success" : "text-destructive"}`}>
      {formatMoney(margin, base)}
      {pct !== null && <span className="text-xs font-normal">({pct.toFixed(0)}%)</span>}
      {incomplete && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" aria-label="Faltan tasas de cambio" />}
    </p>
  );
}
