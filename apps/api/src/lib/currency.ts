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

/** Conversor síncrono: convierte montos sin tocar la BD. */
export type Converter = (
  amount: Prisma.Decimal | number | string,
  from: Currency,
  to: Currency,
) => Prisma.Decimal | null;

/**
 * Precarga todas las tasas del tenant (vigentes a `date`) y devuelve un
 * conversor en memoria. Evita el N+1 al calcular márgenes de muchos viajes.
 */
export async function buildConverter(date: Date = new Date()): Promise<Converter> {
  const rates = await prisma.exchangeRate.findMany({
    where: { date: { lte: date } },
    orderBy: { date: "desc" },
  });
  // La más reciente por par (from→to) gana.
  const latest = new Map<string, Prisma.Decimal>();
  for (const r of rates) {
    const key = `${r.fromCurrency}->${r.toCurrency}`;
    if (!latest.has(key)) latest.set(key, r.rate);
  }
  return (amount, from, to) => {
    if (from === to) return new Decimal(amount);
    const direct = latest.get(`${from}->${to}`);
    if (direct) return new Decimal(amount).mul(direct);
    const inverse = latest.get(`${to}->${from}`);
    if (inverse && !inverse.isZero()) return new Decimal(amount).div(inverse);
    return null;
  };
}
