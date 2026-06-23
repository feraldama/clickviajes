import { Prisma } from "@prisma/client";
import type { Currency } from "@clickviajes/shared";
import { prisma } from "./prisma.js";

const Decimal = Prisma.Decimal;

/**
 * Obtiene la tasa para convertir `from` → `to` vigente a `date` (la más
 * reciente con fecha <= date). Si no existe directa, intenta la inversa.
 * Devuelve null si no hay forma de convertir (falta tasa).
 */
export async function getRate(
  from: Currency,
  to: Currency,
  date: Date = new Date(),
): Promise<Prisma.Decimal | null> {
  if (from === to) return new Decimal(1);

  const direct = await prisma.exchangeRate.findFirst({
    where: { fromCurrency: from, toCurrency: to, date: { lte: date } },
    orderBy: { date: "desc" },
  });
  if (direct) return direct.rate;

  const inverse = await prisma.exchangeRate.findFirst({
    where: { fromCurrency: to, toCurrency: from, date: { lte: date } },
    orderBy: { date: "desc" },
  });
  if (inverse && !inverse.rate.isZero()) return new Decimal(1).div(inverse.rate);

  return null;
}

/** Convierte un monto a otra moneda. Devuelve null si falta la tasa. */
export async function convert(
  amount: Prisma.Decimal | number | string,
  from: Currency,
  to: Currency,
  date?: Date,
): Promise<Prisma.Decimal | null> {
  const rate = await getRate(from, to, date);
  if (!rate) return null;
  return new Decimal(amount).mul(rate);
}
