import type { Currency } from "./constants";

/** Formatea un monto con su moneda (es-PY). PYG sin decimales; resto 2 dec. */
export function formatMoney(amount: number | string | null | undefined, currency: Currency): string {
  if (amount === null || amount === undefined || amount === "") return "—";
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(value)) return "—";
  try {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency,
      minimumFractionDigits: currency === "PYG" ? 0 : 2,
      maximumFractionDigits: currency === "PYG" ? 0 : 2,
    }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}
