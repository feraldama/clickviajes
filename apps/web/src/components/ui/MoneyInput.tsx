"use client";

import { forwardRef, useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import type { Currency } from "@clickviajes/shared";
import { Input } from "./Input";

/**
 * Campo de monto con separador de miles, en formato es-PY (miles con ".",
 * decimales con ",") para que coincida con cómo `formatMoney` muestra los importes.
 *
 * El componente expone hacia afuera un string numérico "crudo" (formato JS, con
 * "." como decimal) en `value`/`onChange`, igual que un `<input>` normal. Así los
 * formularios siguen usando `Number(value)` al enviar sin cambios.
 */
const GROUP = ".";
const DECIMAL = ",";

function decimalsFor(currency: Currency | undefined, override: number | undefined): number {
  if (typeof override === "number") return override;
  if (!currency) return 2;
  return currency === "PYG" ? 0 : 2;
}

/** Agrupa los dígitos enteros de a miles, quitando ceros a la izquierda. */
function groupInt(digits: string): string {
  const clean = digits.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP);
}

/** String crudo (JS, decimal ".") -> display es-PY. */
function rawToDisplay(raw: string, decimals: number): string {
  if (!raw) return "";
  const [intPart = "", decPart] = raw.split(".");
  let out = groupInt(intPart) || (decPart !== undefined ? "0" : "");
  if (decimals > 0 && decPart !== undefined) {
    out += DECIMAL + decPart.replace(/\D/g, "").slice(0, decimals);
  }
  return out;
}

interface TypedParts {
  intDigits: string;
  decDigits: string | null;
  trailingSep: boolean;
}

/** Lee el texto que escribe el usuario. "," es decimal; "." (agrupación) se ignora. */
function readTyped(text: string, decimals: number): TypedParts {
  const s = text.replace(/[^\d,]/g, "");
  const ci = s.indexOf(DECIMAL);
  if (decimals > 0 && ci !== -1) {
    const intDigits = s.slice(0, ci).replace(/\D/g, "");
    const decDigits = s.slice(ci + 1).replace(/\D/g, "").slice(0, decimals);
    return { intDigits, decDigits, trailingSep: decDigits === "" };
  }
  return { intDigits: s.replace(/\D/g, ""), decDigits: null, trailingSep: false };
}

function partsToDisplay({ intDigits, decDigits, trailingSep }: TypedParts): string {
  const grouped = groupInt(intDigits);
  if (decDigits === null) return grouped;
  const head = grouped || "0";
  return trailingSep ? `${head}${DECIMAL}` : `${head}${DECIMAL}${decDigits}`;
}

function partsToRaw({ intDigits, decDigits }: TypedParts): string {
  const int = intDigits.replace(/^0+(?=\d)/, "");
  if (decDigits) return `${int || "0"}.${decDigits}`;
  return int;
}

interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  label: string;
  /** String numérico crudo (formato JS, "." decimal). Cadena vacía = sin valor. */
  value: string;
  /** Recibe el string numérico crudo, listo para `Number(...)`. */
  onChange: (raw: string) => void;
  /** Define los decimales: PYG → 0, resto → 2. Usá `decimals` para forzar otro valor. */
  currency?: Currency;
  decimals?: number;
  error?: string;
  icon?: ReactNode;
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { value, onChange, currency, decimals: decimalsOverride, ...rest },
  ref,
) {
  const decimals = decimalsFor(currency, decimalsOverride);
  const [display, setDisplay] = useState(() => rawToDisplay(value, decimals));
  const lastRaw = useRef(value);

  // Resincroniza cuando el valor crudo cambia por fuera (reset, prefill), nunca
  // en nuestras propias emisiones (preserva la "," final mientras se tipea).
  useEffect(() => {
    if (value !== lastRaw.current) {
      lastRaw.current = value;
      setDisplay(rawToDisplay(value, decimals));
    }
  }, [value, decimals]);

  // Reformatea al cambiar la moneda/decimales (ej. de PYG a USD).
  useEffect(() => {
    setDisplay(rawToDisplay(lastRaw.current, decimals));
  }, [decimals]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const parts = readTyped(e.target.value, decimals);
    const raw = partsToRaw(parts);
    lastRaw.current = raw;
    setDisplay(partsToDisplay(parts));
    onChange(raw);
  }

  return <Input ref={ref} inputMode="decimal" value={display} onChange={handleChange} {...rest} />;
});
