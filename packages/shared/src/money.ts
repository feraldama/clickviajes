import { z } from "zod";
import type { Currency } from "./constants";

// Los montos se transportan como STRING decimal exacto (nunca float), y se
// guardan como Decimal en la BD. Aceptamos string o number en la entrada, pero
// siempre emitimos un string validado.
const DECIMAL_RE = /^\d+(\.\d{1,6})?$/;

/** Monto monetario no negativo (string decimal exacto). */
export const money = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === "number" ? String(v) : v.trim()))
  .refine((s) => DECIMAL_RE.test(s), { message: "Monto inválido" });

/** Monto monetario opcional (string decimal o null). */
export const moneyNullable = z
  .union([z.string(), z.number()])
  .nullish()
  .transform((v) => (v == null || v === "" ? null : typeof v === "number" ? String(v) : v.trim()))
  .refine((s) => s === null || DECIMAL_RE.test(s), { message: "Monto inválido" });

/** Monto/positivo estricto (mayor a 0), p. ej. pagos y tasas. */
export const moneyPositive = money.refine((s) => Number(s) > 0, { message: "Debe ser mayor a 0" });

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
