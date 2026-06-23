import type { QuoteInput, QuoteListQuery, Paginated } from "@clickviajes/shared";
import type { Prisma, QuoteStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { currentTenantId, getTenantContext } from "../../lib/tenant-context.js";
import { AppError } from "../../utils/app-error.js";

const include = {
  customer: { select: { id: true, firstName: true, lastName: true } },
  trip: { select: { id: true, name: true } },
  seller: { select: { id: true, fullName: true } },
  booking: { select: { id: true } },
} satisfies Prisma.QuoteInclude;

async function assertCustomerOwned(customerId: string) {
  const c = await prisma.customer.count({ where: { id: customerId } });
  if (c === 0) throw AppError.badRequest("El cliente no pertenece a la agencia");
}
async function assertTripOwned(tripId: string | null | undefined) {
  if (!tripId) return;
  const t = await prisma.trip.count({ where: { id: tripId } });
  if (t === 0) throw AppError.badRequest("El viaje no pertenece a la agencia");
}

/** Marca como vencidas las cotizaciones DRAFT/SENT cuya validez ya pasó. */
async function expireStaleQuotes() {
  await prisma.quote.updateMany({
    where: { status: { in: ["DRAFT", "SENT"] }, validUntil: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });
}

export async function listQuotes(query: QuoteListQuery): Promise<Paginated<unknown>> {
  await expireStaleQuotes();
  const { search, status, page, pageSize, sortBy, sortDir } = query;
  const where: Prisma.QuoteWhereInput = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          customer: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
            ],
          },
        }
      : {}),
  };
  const orderBy = { [sortBy]: sortDir } as Prisma.QuoteOrderByWithRelationInput;
  const [items, total] = await Promise.all([
    prisma.quote.findMany({ where, include, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.quote.count({ where }),
  ]);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1 };
}

export async function getQuote(id: string) {
  await expireStaleQuotes();
  const quote = await prisma.quote.findFirst({ where: { id }, include });
  if (!quote) throw AppError.notFound("Cotización no encontrada");
  return quote;
}

export async function createQuote(input: QuoteInput) {
  const tenantId = currentTenantId();
  const sellerId = getTenantContext()?.userId;
  if (!tenantId || !sellerId) throw AppError.unauthorized("Sin contexto de agencia/usuario");
  await assertCustomerOwned(input.customerId);
  await assertTripOwned(input.tripId);

  return prisma.quote.create({
    data: {
      tenantId,
      sellerId,
      customerId: input.customerId,
      tripId: input.tripId || null,
      validUntil: input.validUntil ?? null,
      totalAmount: input.totalAmount,
      currency: input.currency,
      notes: input.notes?.trim() || null,
    },
    include,
  });
}

export async function updateQuote(id: string, input: QuoteInput) {
  await getQuote(id);
  await assertCustomerOwned(input.customerId);
  await assertTripOwned(input.tripId);
  return prisma.quote.update({
    where: { id },
    data: {
      customerId: input.customerId,
      tripId: input.tripId || null,
      validUntil: input.validUntil ?? null,
      totalAmount: input.totalAmount,
      currency: input.currency,
      notes: input.notes?.trim() || null,
    },
    include,
  });
}

export async function changeQuoteStatus(id: string, status: QuoteStatus) {
  await getQuote(id);
  return prisma.quote.update({ where: { id }, data: { status }, include });
}

export async function deleteQuote(id: string) {
  await getQuote(id);
  await prisma.quote.delete({ where: { id } });
}
