import type { ExchangeRateInput, ExchangeRateListQuery, Paginated } from "@clickviajes/shared";
import { prisma } from "../../lib/prisma.js";
import { currentTenantId } from "../../lib/tenant-context.js";
import { recordAudit } from "../../lib/audit.js";
import { AppError } from "../../utils/app-error.js";

export async function listRates(query: ExchangeRateListQuery): Promise<Paginated<unknown>> {
  const { page, pageSize } = query;
  const [items, total] = await Promise.all([
    prisma.exchangeRate.findMany({ orderBy: { date: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.exchangeRate.count(),
  ]);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1 };
}

export async function createRate(input: ExchangeRateInput) {
  const tenantId = currentTenantId();
  if (!tenantId) throw AppError.unauthorized("Sin agencia en contexto");
  const created = await prisma.exchangeRate.create({
    data: {
      tenantId,
      fromCurrency: input.fromCurrency,
      toCurrency: input.toCurrency,
      rate: input.rate,
      date: input.date,
    },
  });
  await recordAudit("rate.create", "ExchangeRate", created.id, `Tasa ${input.fromCurrency}→${input.toCurrency}: ${input.rate}`);
  return created;
}

export async function deleteRate(id: string) {
  const rate = await prisma.exchangeRate.findFirst({ where: { id } });
  if (!rate) throw AppError.notFound("Tasa no encontrada");
  await prisma.exchangeRate.delete({ where: { id } });
  await recordAudit("rate.delete", "ExchangeRate", id, `Tasa eliminada ${rate.fromCurrency}→${rate.toCurrency}`);
}
